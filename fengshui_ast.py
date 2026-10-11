"""
代码风水罗盘 (CodeFengShui) - 真实 AST 静态堪舆分析引擎
将圈复杂度、嵌套深度、全局污染与死锁隐患映射为东方风水神煞体系。
"""

import ast
import re
from typing import Dict, List, Any


class FengShuiAnalyzer:
    """硬核代码风水堪舆器"""

    SHAS_DEFINITION = {
        "LONGMAI_BLOCKED": {
            "name": "龙脉淤塞煞",
            "element": "土",
            "omen": "大凶",
            "desc": "单函数行数超过 60 行或逻辑分支过长，气运堵塞，维护者易生心悸烦躁之象。"
        },
        "JIUYIN_PIERCING": {
            "name": "九阴穿心煞",
            "element": "水",
            "omen": "大凶",
            "desc": "嵌套层级超过 4 层（回调地狱或深层分支），九阴寒气直透脊梁，线上极易失控。"
        },
        "ANCESTRAL_SMOKE": {
            "name": "祖坟冒黑烟",
            "element": "火",
            "omen": "绝凶",
            "desc": "肆意污染全局作用域或粗暴挂载 window/global，祖师爷棺材板压制不住，整机随时 OOM。"
        },
        "TRAPPED_DRAGON": {
            "name": "困龙绝命阵",
            "element": "金",
            "omen": "凶",
            "desc": "死循环、未设置超时的异步竞态或死锁隐患，神龙被困泥潭，请求永久挂起。"
        },
        "POVERTY_STAR": {
            "name": "破财败运星",
            "element": "木",
            "omen": "大凶",
            "desc": "硬编码秘钥、明文密码或直接用浮点数运算账目，公司库房洞开，财气外泄。"
        },
        "SILENT_TOMB": {
            "name": "掩耳盗铃棺",
            "element": "阴",
            "omen": "凶",
            "desc": "空 catch 吞掉异常返回 null，皇帝新衣掩盖祸端，丧钟已隐隐敲响。"
        }
    }

    def analyze_python_ast(self, code: str) -> Dict[str, Any]:
        """对 Python 代码进行原生 AST 解析"""
        issues = []
        max_depth = 0
        max_func_len = 0
        complexity = 1
        global_writes = 0

        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            return self._fallback_regex_analyze(code, syntax_error=str(e))

        # 遍历 AST 节点
        for node in ast.walk(tree):
            # 复杂度计算 (if, for, while, try, except, with, etc.)
            if isinstance(node, (ast.If, ast.For, ast.While, ast.ExceptHandler, ast.With, ast.Assert)):
                complexity += 1

            # 全局变量定义
            if isinstance(node, ast.Global):
                global_writes += len(node.names)

            # 函数长度与嵌套分析
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                func_len = getattr(node, 'end_lineno', node.lineno) - node.lineno + 1
                if func_len > max_func_len:
                    max_func_len = func_len
                if func_len > 50:
                    issues.append({
                        "type": "LONGMAI_BLOCKED",
                        "line": node.lineno,
                        "func_name": node.name,
                        "value": f"{func_len} 行",
                        "detail": f"函数 `{node.name}` 龙脉绵延 {func_len} 行，阳气郁结，宜重构拆解。"
                    })

        # 嵌套层级分析
        def calculate_depth(n, current_depth=0):
            nonlocal max_depth
            if current_depth > max_depth:
                max_depth = current_depth
            for child in ast.iter_child_nodes(n):
                next_depth = current_depth + 1 if isinstance(child, (ast.If, ast.For, ast.While, ast.Try, ast.With)) else current_depth
                calculate_depth(child, next_depth)

        calculate_depth(tree)
        if max_depth >= 4:
            issues.append({
                "type": "JIUYIN_PIERCING",
                "line": 1,
                "value": f"{max_depth} 层嵌套",
                "detail": f"核心控制流嵌套深达 {max_depth} 重，九阴穿心，凡人不可读。"
            })

        if global_writes > 0:
            issues.append({
                "type": "ANCESTRAL_SMOKE",
                "line": 1,
                "value": f"{global_writes} 个全局引用",
                "detail": f"滥用 global 变量破坏风水单例，祖坟青烟转浓黑。"
            })

        # 检查空异常吞没
        for node in ast.walk(tree):
            if isinstance(node, ast.ExceptHandler):
                if len(node.body) == 1 and isinstance(node.body[0], ast.Pass):
                    issues.append({
                        "type": "SILENT_TOMB",
                        "line": node.lineno,
                        "value": "except: pass",
                        "detail": "静默吞噬异常，若大厦将倾却无警报，此乃大凶暗桩。"
                    })

        return self._build_report(code, issues, complexity, max_depth, max_func_len)

    def analyze_javascript(self, code: str) -> Dict[str, Any]:
        """对 JavaScript/TypeScript 进行词法与风水特征分析"""
        issues = []
        lines = code.split('\n')
        total_lines = len(lines)
        complexity = 1
        max_depth = 0
        current_depth = 0

        # 全文跨行多行正则扫描
        # 1. 祖坟冒黑烟：window.xxx 或 global.xxx
        for match in re.finditer(r'\b(window\.[a-zA-Z0-9_]+|window\.god)\s*=', code):
            line_no = code[:match.start()].count('\n') + 1
            issues.append({
                "type": "ANCESTRAL_SMOKE",
                "line": line_no,
                "value": match.group(0),
                "detail": f"第 {line_no} 行直接给 window 强挂全局副作用，祖坟烈火熊熊，阴魂不散。"
            })

        # 2. 掩耳盗铃：空 catch 或 catch return null (支持跨行与包含单行/多行注释)
        for match in re.finditer(r'catch\s*\([^)]*\)\s*\{(?:\s*//[^\n]*|\s*/\*[\s\S]*?\*/|\s*)*(return\s+null;|return;|throw\s+null;|\s*)(?:\s*//[^\n]*|\s*/\*[\s\S]*?\*/|\s*)*\}', code, re.DOTALL):
            line_no = code[:match.start()].count('\n') + 1
            issues.append({
                "type": "SILENT_TOMB",
                "line": line_no,
                "value": "catch { return null; }",
                "detail": f"第 {line_no} 行静默捕获异常并吞噬，线上暴雷时连哀鸣都听不见。"
            })

        # 3. 破财煞：硬编码密钥
        for match in re.finditer(r'(api_key|secret|password|token)\s*[:=]\s*["\'][a-zA-Z0-9_\-]{8,}["\']', code, re.I):
            line_no = code[:match.start()].count('\n') + 1
            issues.append({
                "type": "POVERTY_STAR",
                "line": line_no,
                "value": "硬编码明文密钥",
                "detail": f"第 {line_no} 行明文暴露机密密钥，金库大门洞开，财运荡然无存。"
            })

        # 4. 困龙绝命：setInterval 内存黑洞 或 无超时死锁忙等
        for match in re.finditer(r'setInterval[\s\S]*?(?:Array\(|new Array|100000|\.fill\()', code):
            line_no = code[:match.start()].count('\n') + 1
            issues.append({
                "type": "TRAPPED_DRAGON",
                "line": line_no,
                "value": "高频无节制 setInterval 内存泄漏",
                "detail": f"第 {line_no} 行无终止定时器疯狂吞噬内存，困龙于死局，客户端顷刻暴毙。"
            })

        for match in re.finditer(r'while\s*\([^)]*(?:\.locked|locked|Deadlock)[^)]*\)', code, re.I):
            line_no = code[:match.start()].count('\n') + 1
            issues.append({
                "type": "TRAPPED_DRAGON",
                "line": line_no,
                "value": "并发无超时忙等死锁",
                "detail": f"第 {line_no} 行存在未设置熔断超时的资源争锁死等循环，困龙绝命，线程池注定枯竭。"
            })

        # 逐行统计复杂度与嵌套深度
        for idx, line in enumerate(lines, start=1):
            stripped = line.strip()

            # 复杂度探测 (if, else if, for, while, switch, catch, &&, ||, ?)
            branch_matches = len(re.findall(r'\b(if|for|while|switch|catch)\b|\?|&&|\|\|', stripped))
            complexity += branch_matches

            # 括号层级深度
            open_braces = stripped.count('{')
            close_braces = stripped.count('}')
            current_depth += (open_braces - close_braces)
            if current_depth > max_depth:
                max_depth = current_depth

        if max_depth >= 4:
            issues.append({
                "type": "JIUYIN_PIERCING",
                "line": 1,
                "value": f"{max_depth} 层深渊嵌套",
                "detail": f"代码控制流深达 {max_depth} 重，九阴之煞直冲天灵盖。"
            })

        if total_lines > 60:
            issues.append({
                "type": "LONGMAI_BLOCKED",
                "line": 1,
                "value": f"{total_lines} 行长代码",
                "detail": f"单段代码通篇共 {total_lines} 行，龙脉淤塞，阳气难通。"
            })

        return self._build_report(code, issues, complexity, max_depth, total_lines)

    def _fallback_regex_analyze(self, code: str, syntax_error: str = "") -> Dict[str, Any]:
        """降级正则分析"""
        return self.analyze_javascript(code)

    def _build_report(self, code: str, issues: List[Dict[str, Any]], complexity: int, depth: int, max_len: int) -> Dict[str, Any]:
        """构建风水八字堪舆综合报告"""
        sha_points = 0
        sha_list = []

        for issue in issues:
            sha_info = self.SHAS_DEFINITION.get(issue["type"], {
                "name": "杂散阴煞",
                "element": "阴",
                "omen": "平",
                "desc": "代码轻微不顺。"
            })
            item = {
                **issue,
                "sha_name": sha_info["name"],
                "element": sha_info["element"],
                "omen": sha_info["omen"],
                "sha_desc": sha_info["desc"]
            }
            sha_list.append(item)
            if sha_info["omen"] == "绝凶":
                sha_points += 40
            elif sha_info["omen"] == "大凶":
                sha_points += 25
            else:
                sha_points += 15

        # 加上复杂度煞气
        sha_points += min(complexity * 3, 30)

        # 封顶 100
        sha_score = min(sha_points, 100)

        # 吉凶定级与八字命盘
        if sha_score >= 80:
            rank = "大凶 · 劫数难逃"
            omen_color = "#f43f5e"
            bazi = "庚子 戊子 凶神坐煞 亡劫同临"
            fengshui_verdict = "此段代码煞气冲天，五行严重失调！若强行上线，三更半夜必有警报破门，主程宜速作重构法事！"
            compass_angle = 180 + (sha_score % 15) * 5  # 针指大凶地支
            talisman_needed = True
        elif sha_score >= 50:
            rank = "凶 · 龙脉受损"
            omen_color = "#f97316"
            bazi = "丙戌 己丑 官杀混杂 龙脉郁结"
            fengshui_verdict = "气运受阻，有隐伏之患。虽然尚能编译运行，但已有九阴穿心之象，宜早点除煞。"
            compass_angle = 120 + (sha_score % 20) * 3
            talisman_needed = True
        elif sha_score >= 20:
            rank = "平 · 阴阳微和"
            omen_color = "#eab308"
            bazi = "甲寅 乙卯 木气过旺 稍欠洗练"
            fengshui_verdict = "寻常人间代码，无大灾大难，亦无神来之笔。日常加固即可，无须兴师动众。"
            compass_angle = 60 + (sha_score % 10) * 4
            talisman_needed = False
        else:
            rank = "大吉 · 紫气东来"
            omen_color = "#10b981"
            bazi = "甲子 丙寅 天德贵人 诸邪退避"
            fengshui_verdict = "行云流水，气贯长虹！单测全绿且模块分明，祖师爷微笑点头，合入主干保一年平安！"
            compass_angle = 0 + (sha_score * 2)
            talisman_needed = False

        return {
            "sha_score": sha_score,
            "rank": rank,
            "omen_color": omen_color,
            "bazi": bazi,
            "complexity": complexity,
            "max_depth": depth,
            "max_len": max_len,
            "issues_count": len(issues),
            "shas": sha_list,
            "verdict": fengshui_verdict,
            "compass_angle": compass_angle,
            "talisman_needed": talisman_needed
        }
