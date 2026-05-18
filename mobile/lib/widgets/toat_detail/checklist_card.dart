import 'package:flutter/material.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';
import 'package:toatre/widgets/toat_detail/section_card.dart';

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

    return SectionCard(
      title: 'Checklist',
      action: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (widget.saving)
            const SizedBox(
              width: 14,
              height: 14,
              child: CircularProgressIndicator(strokeWidth: 1.5),
            )
          else
            Text(
              '$doneCount/${items.length}',
              style: TextStyles.smallMedium.copyWith(
                color: const Color(0xFF7B8494),
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          const SizedBox(width: 10),
          _AddItemButton(onTap: widget.onAdd),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ReorderableListView.builder(
            shrinkWrap: true,
            buildDefaultDragHandles: false,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: items.length,
            proxyDecorator: (child, index, animation) {
              return Material(color: Colors.transparent, child: child);
            },
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
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      child: Row(
                        children: [
                          ReorderableDelayedDragStartListener(
                            index: index,
                            child: const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 2),
                              child: Icon(
                                Icons.drag_indicator_rounded,
                                size: 18,
                                color: Color(0xFFD4D8DF),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          _ChecklistToggleButton(
                            done: done,
                            onTap: () => widget.onToggle(index),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: TextField(
                              controller: ctrl,
                              focusNode: focus,
                              maxLines: 1,
                              cursorColor: AppColors.primary,
                              style: TextStyles.body.copyWith(
                                color: done
                                    ? const Color(0xFF9A948B)
                                    : const Color(0xFF111827),
                                fontSize: 15,
                                fontWeight: FontWeight.w500,
                                decoration: done
                                    ? TextDecoration.lineThrough
                                    : TextDecoration.none,
                              ),
                              decoration: InputDecoration(
                                isDense: true,
                                hintText: 'Item text…',
                                hintStyle: TextStyles.body.copyWith(
                                  color: const Color(0xFF9CA3AF),
                                  fontSize: 15,
                                  fontWeight: FontWeight.w500,
                                ),
                                contentPadding: EdgeInsets.zero,
                                border: InputBorder.none,
                              ),
                              onChanged: (v) => widget.onTextChanged(index, v),
                            ),
                          ),
                          const SizedBox(width: 8),
                          _ChecklistDeleteButton(
                            onTap: () => widget.onDelete(index),
                          ),
                        ],
                      ),
                    ),
                    if (index != items.length - 1)
                      const Padding(
                        padding: EdgeInsets.only(left: 56, right: 10),
                        child: Divider(
                          height: 1,
                          thickness: 1,
                          color: Color(0x26CFC6B8),
                        ),
                      ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _ChecklistToggleButton extends StatelessWidget {
  const _ChecklistToggleButton({required this.done, required this.onTap});

  final bool done;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          width: 22,
          height: 22,
          decoration: BoxDecoration(
            color: done ? const Color(0xFF57C97A) : Colors.transparent,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(
              color: done ? const Color(0xFF57C97A) : const Color(0xFF6AD185),
              width: 1.8,
            ),
          ),
          child: done
              ? const Icon(Icons.check_rounded, size: 14, color: Colors.white)
              : null,
        ),
      ),
    );
  }
}

class _AddItemButton extends StatelessWidget {
  const _AddItemButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return TextButton.icon(
      onPressed: onTap,
      icon: const Icon(Icons.add_rounded, size: 16),
      label: Text(
        'Add item',
        style: TextStyles.smallMedium.copyWith(
          color: AppColors.primary,
          fontWeight: FontWeight.w700,
        ),
      ),
      style: TextButton.styleFrom(
        foregroundColor: AppColors.primary,
        backgroundColor: const Color(0xFFF4EEFF),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(999),
          side: const BorderSide(color: Color(0xFFE2D7FF)),
        ),
      ),
    );
  }
}

class _ChecklistDeleteButton extends StatelessWidget {
  const _ChecklistDeleteButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: const SizedBox(
          width: 24,
          height: 24,
          child: Icon(Icons.close_rounded, size: 18, color: Color(0xFF9CA3AF)),
        ),
      ),
    );
  }
}
