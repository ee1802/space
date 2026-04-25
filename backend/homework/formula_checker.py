"""
Formula equivalence checker using SymPy.
Compares student's LaTeX formula with the correct answer.
"""
import re
import logging

logger = logging.getLogger(__name__)


def normalize_latex(latex_str):
    """Normalize LaTeX string for string comparison fallback."""
    if not latex_str:
        return ''
    s = latex_str.strip()
    s = re.sub(r'\s+', '', s)
    s = s.lower()
    s = s.replace('\\cdot', '*')
    s = s.replace('\\times', '*')
    s = s.replace('\\div', '/')
    return s


def check_formula_equivalence(student_latex, correct_latex):
    """
    Check if two LaTeX formulas are mathematically equivalent.
    Returns (is_correct: bool, method: str)
    method is 'sympy', 'string', or 'error'
    """
    try:
        from sympy.parsing.latex import parse_latex
        from sympy import simplify, N

        student_expr = parse_latex(student_latex)
        correct_expr = parse_latex(correct_latex)

        diff = simplify(student_expr - correct_expr)
        if diff == 0:
            return True, 'sympy'

        # Try numerical evaluation
        try:
            numeric_diff = abs(float(N(diff)))
            if numeric_diff < 1e-10:
                return True, 'sympy_numeric'
        except (TypeError, ValueError):
            pass

        return False, 'sympy'

    except Exception as e:
        logger.warning(f'SymPy parsing failed, falling back to string comparison: {e}')
        # Fallback: string comparison
        norm_student = normalize_latex(student_latex)
        norm_correct = normalize_latex(correct_latex)
        if norm_student == norm_correct:
            return True, 'string'
        return False, 'string_fallback'


def check_number_answer(student_value, correct_value, tolerance_type, tolerance):
    """
    Check if a numeric answer is within tolerance.
    tolerance_type: 'abs' or 'rel'
    """
    try:
        student = float(student_value)
        correct = float(correct_value)

        if tolerance_type == 'abs':
            return abs(student - correct) <= float(tolerance)
        elif tolerance_type == 'rel':
            if correct == 0:
                return abs(student) <= float(tolerance)
            return abs(student - correct) / abs(correct) <= float(tolerance)
        return False
    except (TypeError, ValueError):
        return False


def check_choice_answer(student_option_ids, correct_option_ids, is_multiple=False):
    """Check if selected options match correct options."""
    if is_multiple:
        return set(str(x) for x in student_option_ids) == set(str(x) for x in correct_option_ids)
    else:
        return str(student_option_ids) == str(correct_option_ids)
