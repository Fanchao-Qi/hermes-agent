"""session.branch cut point: bubble count vs stored rows."""

from tui_gateway import server


def _rows():
    # One tool turn stores three text-bearing assistant rows; the desktop renders them as ONE bubble.
    return [
        {"role": "user", "content": "q1", "_row_id": 1},
        {"role": "assistant", "content": "looking", "_row_id": 2},
        {"role": "assistant", "content": "found it", "_row_id": 4},
        {"role": "assistant", "content": "answer", "_row_id": 6},
        {"role": "user", "content": "q2", "_row_id": 7},
        {"role": "assistant", "content": "a2", "_row_id": 8},
    ]


def test_through_row_id_keeps_every_row_of_the_clicked_bubble():
    # Bubbles: [q1] [looking+found+answer]  -> the desktop sends count=2 and the last row id 6.
    kept = server._truncate_branch_history(_rows(), {"count": 2, "through_row_id": 6})
    assert [m["_row_id"] for m in kept] == [1, 2, 4, 6]


def test_count_alone_undercuts_folded_turns():
    # The legacy behaviour this guards against: count=2 stops at "looking".
    kept = server._truncate_branch_history(_rows(), {"count": 2})
    assert [m["_row_id"] for m in kept] == [1, 2]


def test_unknown_row_id_falls_back_to_count():
    kept = server._truncate_branch_history(_rows(), {"count": 5, "through_row_id": 999})
    assert len(kept) == 5


def test_bool_row_id_is_ignored_and_no_params_keeps_everything():
    assert len(server._truncate_branch_history(_rows(), {"through_row_id": True})) == 6
    assert len(server._truncate_branch_history(_rows(), {})) == 6
