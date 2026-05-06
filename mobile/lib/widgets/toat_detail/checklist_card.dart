import 'package:flutter/material.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';

/// A drag-reorderable, interactive checklist widget.
class ChecklistCard extends StatefulWidget {
  const ChecklistCard({
    super.key,
    required this.items,
    required this.saving,
    required this.onReorder,
    required this.onToggle,
    required this.onTextChanged,
    required this.onDelete,
    required this.onAdd,
  });

  final List<Map<String, dynamic>> items;
  final bool saving;
  final void Function(List<Map<String, dynamic>> items) onReorder;
  final void Function(int index) onToggle;
  final void Function(int index, String text) onTextChanged;
  final void Function(int index) onDelete;
  final VoidCallback onAdd;

  @override
  State<ChecklistCard> createState() => _ChecklistCardState();
}

class _ChecklistCardState extends State<ChecklistCard> {
  final Map<int, TextEditingController> _controllers = {};
  final Map<int, FocusNode> _focusNodes = {};

  @override
  void dispose() {
    for (final c in _controllers.values) {
      c.dispose();
    }
    for (final f in _focusNodes.values) {
      f.dispose();
    }
    super.dispose();
  }

  TextEditingController _ctrl(int index, String text) {
    return _controllers.putIfAbsent(
      index,
      () => TextEditingController(text: text),
    );
  }

  FocusNode _focus(int index) {
    return _focusNodes.putIfAbsent(index, () => FocusNode());
  }

  @override
  Widget build(BuildContext context) {
    final items = widget.items;
    final doneCount = items.where((x) => x['done'] as bool? ?? false).length;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 16, 18, 10),
            child: Row(
              children: [
                Text(
                  'Checklist',
                  style: TextStyles.bodyMedium.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                const Spacer(),
                if (widget.saving)
                  const SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(strokeWidth: 1.5),
                  )
                else
                  Text(
                    '$doneCount/${items.length}',
                    style: TextStyles.small.copyWith(
                      color: AppColors.textMuted,
                    ),
                  ),
              ],
            ),
          ),
          ReorderableListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: items.length,
            onReorder: (oldIndex, newIndex) {
              final updated = [...items];
              if (newIndex > oldIndex) newIndex -= 1;
              final item = updated.removeAt(oldIndex);
              updated.insert(newIndex, item);
              _controllers.clear();
              _focusNodes.clear();
              widget.onReorder(updated);
            },
            itemBuilder: (context, index) {
              final item = items[index];
              final done = item['done'] as bool? ?? false;
              final text = item['text'] as String? ?? '';
              final ctrl = _ctrl(index, text);
              final focus = _focus(index);

              if (ctrl.text != text && !focus.hasFocus) {
                ctrl.text = text;
              }

              return KeyedSubtree(
                key: ValueKey(item['id'] ?? index),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 3,
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.drag_handle_rounded,
                        size: 18,
                        color: AppColors.textMuted,
                      ),
                      const SizedBox(width: 4),
                      SizedBox(
                        width: 32,
                        height: 32,
                        child: Checkbox(
                          value: done,
                          onChanged: (_) => widget.onToggle(index),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(6),
                          ),
                        ),
                      ),
                      Expanded(
                        child: TextField(
                          controller: ctrl,
                          focusNode: focus,
                          style: TextStyles.body.copyWith(
                            color: done ? AppColors.textMuted : AppColors.text,
                            decoration: done
                                ? TextDecoration.lineThrough
                                : TextDecoration.none,
                          ),
                          decoration: const InputDecoration(
                            isDense: true,
                            contentPadding: EdgeInsets.zero,
                            border: InputBorder.none,
                          ),
                          onChanged: (v) => widget.onTextChanged(index, v),
                        ),
                      ),
                      GestureDetector(
                        onTap: () => widget.onDelete(index),
                        child: const Padding(
                          padding: EdgeInsets.all(8),
                          child: Icon(
                            Icons.close_rounded,
                            size: 16,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 4, 12, 14),
            child: TextButton.icon(
              onPressed: widget.onAdd,
              icon: const Icon(Icons.add_rounded, size: 18),
              label: const Text('Add item'),
              style: TextButton.styleFrom(
                foregroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
