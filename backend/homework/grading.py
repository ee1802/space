"""
Shared answer-grading logic, reused by homework submissions and timed mock
olympiad attempts. Keeping it in one place guarantees both flows grade
identically.
"""
from .models import ProblemOption
from .formula_checker import (
    check_formula_equivalence, check_number_answer,
)


def grade_answer(problem, answer_data):
    """
    Grade a single answer for a problem.

    Returns a dict:
        {
            'is_auto_checked': bool,   # False only for free-text answers
            'is_correct': bool | None, # None for text (awaiting manual grading)
            'score': int | None,       # None for text until graded
        }
    """
    answer_data = answer_data or {}

    if problem.answer_type == 'text':
        return {'is_auto_checked': False, 'is_correct': None, 'score': None}

    if problem.answer_type == 'choice_single':
        correct = problem.correct_answer
        if correct and 'correct_option_id' in correct:
            student_option = str(answer_data.get('option_id', ''))
            is_correct = student_option == str(correct['correct_option_id'])
        else:
            correct_ids = list(
                ProblemOption.objects.filter(problem=problem, is_correct=True)
                .values_list('id', flat=True)
            )
            student_option = answer_data.get('option_id')
            is_correct = int(student_option) in correct_ids if student_option else False
        return {
            'is_auto_checked': True,
            'is_correct': is_correct,
            'score': problem.max_score if is_correct else 0,
        }

    if problem.answer_type == 'choice_multiple':
        correct = problem.correct_answer
        if correct and 'correct_option_ids' in correct:
            correct_ids = set(str(x) for x in correct['correct_option_ids'])
        else:
            correct_ids = set(
                str(x) for x in ProblemOption.objects.filter(problem=problem, is_correct=True)
                .values_list('id', flat=True)
            )
        student_ids = set(str(x) for x in answer_data.get('option_ids', []))
        is_correct = bool(correct_ids) and correct_ids == student_ids
        return {
            'is_auto_checked': True,
            'is_correct': is_correct,
            'score': problem.max_score if is_correct else 0,
        }

    if problem.answer_type == 'number':
        correct = problem.correct_answer or {}
        is_correct = check_number_answer(
            answer_data.get('value'),
            correct.get('value', 0),
            correct.get('tolerance_type', 'abs'),
            correct.get('tolerance', 0),
        )
        return {
            'is_auto_checked': True,
            'is_correct': is_correct,
            'score': problem.max_score if is_correct else 0,
        }

    if problem.answer_type == 'formula':
        correct = problem.correct_answer or {}
        is_correct, _method = check_formula_equivalence(
            answer_data.get('latex', ''), correct.get('latex', '')
        )
        return {
            'is_auto_checked': True,
            'is_correct': is_correct,
            'score': problem.max_score if is_correct else 0,
        }

    # Unknown answer type — treat as manual.
    return {'is_auto_checked': False, 'is_correct': None, 'score': None}
