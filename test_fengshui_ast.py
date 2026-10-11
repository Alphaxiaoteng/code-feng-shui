"""
单元测试：代码风水堪舆引擎
验证 Python/JS 代码的真实 AST 解析、煞气值计算及吉凶八字定级。
"""

import pytest
from fengshui_ast import FengShuiAnalyzer


def test_clean_code_is_daji():
    """测试优美干净代码评定为大吉"""
    analyzer = FengShuiAnalyzer()
    clean_python = """
def add(a: int, b: int) -> int:
    \"\"\"纯函数，无任何副作用与煞气\"\"\"
    return a + b
"""
    report = analyzer.analyze_python_ast(clean_python)
    assert report["sha_score"] < 20
    assert "大吉" in report["rank"]
    assert report["issues_count"] == 0
    assert report["talisman_needed"] is False


def test_ancestral_smoke_detected():
    """测试检测出 window.god 祖坟冒黑烟绝凶煞"""
    analyzer = FengShuiAnalyzer()
    bad_js = """
// 祖传挂载
window.god = {
    fix: () => localStorage.clear(),
    leaks: setInterval(() => {
        window.__arr = (window.__arr || []).concat(new Array(100000).fill('💥'));
    }, 1000)
};
"""
    report = analyzer.analyze_javascript(bad_js)
    assert report["sha_score"] >= 80
    assert "大凶" in report["rank"]
    sha_types = [s["type"] for s in report["shas"]]
    assert "ANCESTRAL_SMOKE" in sha_types
    assert "TRAPPED_DRAGON" in sha_types
    assert report["talisman_needed"] is True


def test_silent_catch_detected():
    """测试检测出掩耳盗铃棺（空 catch 返回 null）"""
    analyzer = FengShuiAnalyzer()
    silent_js = """
async function charge(customerId, amount) {
    try {
        return await stripe.charge(customerId, amount);
    } catch (e) {
        return null;
    }
}
"""
    report = analyzer.analyze_javascript(silent_js)
    sha_types = [s["type"] for s in report["shas"]]
    assert "SILENT_TOMB" in sha_types


def test_deep_nesting_jiuyin_piercing():
    """测试深度嵌套触发九阴穿心煞"""
    analyzer = FengShuiAnalyzer()
    deep_python = """
def deep_hell():
    if True:
        for i in range(10):
            while True:
                try:
                    if False:
                        pass
                except Exception:
                    pass
"""
    report = analyzer.analyze_python_ast(deep_python)
    assert report["max_depth"] >= 4
    sha_types = [s["type"] for s in report["shas"]]
    assert "JIUYIN_PIERCING" in sha_types
