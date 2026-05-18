import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';
import 'package:toatre/widgets/toat_detail/section_card.dart';

class NotesCard extends StatelessWidget {
  const NotesCard({super.key, required this.notes, required this.onEdit});

  final String? notes;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    final trimmedNotes = notes?.trim() ?? '';

    return SectionCard(
      title: 'Notes',
      action: _GhostActionButton(
        label: trimmedNotes.isEmpty ? 'Add notes' : 'Edit',
        icon: trimmedNotes.isEmpty
            ? Icons.add_rounded
            : Icons.edit_note_rounded,
        onTap: onEdit,
      ),
      child: trimmedNotes.isEmpty
          ? Text(
              'No notes yet. Plain text works, and Markdown is optional.',
              style: TextStyles.body.copyWith(
                color: AppColors.textSecondary,
                height: 1.55,
              ),
            )
          : MarkdownBody(
              data: trimmedNotes,
              selectable: false,
              shrinkWrap: true,
              styleSheet: MarkdownStyleSheet.fromTheme(Theme.of(context))
                  .copyWith(
                    p: TextStyles.body.copyWith(
                      color: AppColors.text,
                      height: 1.65,
                    ),
                    h1: TextStyles.heading2.copyWith(color: AppColors.text),
                    h2: TextStyles.heading3.copyWith(color: AppColors.text),
                    h3: TextStyles.bodyMedium.copyWith(color: AppColors.text),
                    listBullet: TextStyles.body.copyWith(color: AppColors.text),
                    blockquote: TextStyles.body.copyWith(
                      color: AppColors.textSecondary,
                      height: 1.6,
                    ),
                    blockquoteDecoration: BoxDecoration(
                      color: const Color(0x146D28D9),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0x306D28D9)),
                    ),
                    code: TextStyles.smallMedium.copyWith(
                      color: AppColors.text,
                    ),
                    codeblockDecoration: BoxDecoration(
                      color: const Color(0xFFF6F2FF),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    a: TextStyles.bodyMedium.copyWith(
                      color: AppColors.primary,
                      decoration: TextDecoration.underline,
                    ),
                    horizontalRuleDecoration: const BoxDecoration(
                      border: Border(top: BorderSide(color: Color(0x1FDBE1EA))),
                    ),
                  ),
              onTapLink: (text, href, title) {
                if (href == null || href.trim().isEmpty) {
                  return;
                }
                final uri = Uri.tryParse(href.trim());
                if (uri == null) {
                  return;
                }
                unawaited(launchUrl(uri, mode: LaunchMode.externalApplication));
              },
            ),
    );
  }
}

class NotesEditorSheet extends StatefulWidget {
  const NotesEditorSheet({super.key, required this.initialValue});

  final String initialValue;

  @override
  State<NotesEditorSheet> createState() => _NotesEditorSheetState();
}

class _NotesEditorSheetState extends State<NotesEditorSheet> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialValue);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return SafeArea(
      top: false,
      child: Padding(
        padding: EdgeInsets.fromLTRB(20, 12, 20, bottomInset + 20),
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.bgElevated,
            borderRadius: BorderRadius.circular(28),
            boxShadow: const [
              BoxShadow(
                color: Color(0x33111827),
                blurRadius: 28,
                offset: Offset(0, 16),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Edit notes', style: TextStyles.heading2),
                          const SizedBox(height: 6),
                          Text(
                            'Keep it plain if you want. Use the formatting buttons only when you need Markdown.',
                            style: TextStyles.small.copyWith(
                              color: AppColors.textSecondary,
                              height: 1.45,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.close_rounded),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _FormatChip(
                      label: 'B',
                      tooltip: 'Bold',
                      onTap: () => _wrapSelection('**', '**', 'bold text'),
                    ),
                    _FormatChip(
                      label: 'I',
                      tooltip: 'Italic',
                      onTap: () => _wrapSelection('*', '*', 'italic text'),
                    ),
                    _FormatChip(
                      label: 'H',
                      tooltip: 'Heading',
                      onTap: () => _prefixLines('## '),
                    ),
                    _FormatChip(
                      label: 'List',
                      tooltip: 'Bulleted list',
                      onTap: () => _prefixLines('- '),
                    ),
                    _FormatChip(
                      label: 'Link',
                      tooltip: 'Link',
                      onTap: _insertLink,
                    ),
                    _FormatChip(
                      label: 'Quote',
                      tooltip: 'Quote',
                      onTap: () => _prefixLines('> '),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxHeight: 280),
                  child: TextField(
                    controller: _controller,
                    maxLines: null,
                    minLines: 8,
                    autofocus: true,
                    style: TextStyles.body.copyWith(
                      color: AppColors.text,
                      height: 1.55,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Add a note...',
                      hintStyle: TextStyles.body.copyWith(
                        color: AppColors.textSecondary,
                      ),
                      filled: true,
                      fillColor: const Color(0xFFF8F7FB),
                      contentPadding: const EdgeInsets.all(16),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(18),
                        borderSide: BorderSide(color: AppColors.border),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(18),
                        borderSide: BorderSide(color: AppColors.border),
                      ),
                      focusedBorder: const OutlineInputBorder(
                        borderRadius: BorderRadius.all(Radius.circular(18)),
                        borderSide: BorderSide(color: AppColors.primary),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'Plain text works too. Markdown is optional: bold, italic, headings, lists, links, and quotes.',
                  style: TextStyles.small.copyWith(
                    color: AppColors.textSecondary,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.of(context).pop(),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(46),
                          side: BorderSide(color: AppColors.border),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: const Text('Cancel'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () =>
                            Navigator.of(context).pop(_controller.text),
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size.fromHeight(46),
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: const Text('Save notes'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _wrapSelection(String prefix, String suffix, String placeholder) {
    final selection = _controller.selection;
    final text = _controller.text;
    final start = selection.start < 0 ? text.length : selection.start;
    final end = selection.end < 0 ? text.length : selection.end;
    final selectedText = text.substring(start, end);
    final innerText = selectedText.isEmpty ? placeholder : selectedText;
    final replacement = '$prefix$innerText$suffix';
    final next = text.replaceRange(start, end, replacement);

    _controller.value = TextEditingValue(
      text: next,
      selection: TextSelection(
        baseOffset: start + prefix.length,
        extentOffset: start + prefix.length + innerText.length,
      ),
    );
  }

  void _prefixLines(String prefix) {
    final selection = _controller.selection;
    final text = _controller.text;
    final start = selection.start < 0 ? text.length : selection.start;
    final end = selection.end < 0 ? text.length : selection.end;
    final lineStart = text.lastIndexOf('\n', start - 1);
    final blockStart = lineStart == -1 ? 0 : lineStart + 1;
    final nextLineBreak = text.indexOf('\n', end);
    final blockEnd = nextLineBreak == -1 ? text.length : nextLineBreak;
    final block = text.substring(blockStart, blockEnd);
    final updatedBlock = block
        .split('\n')
        .map((line) => line.trim().isEmpty ? line : '$prefix$line')
        .join('\n');
    final next = text.replaceRange(blockStart, blockEnd, updatedBlock);

    _controller.value = TextEditingValue(
      text: next,
      selection: TextSelection(
        baseOffset: blockStart,
        extentOffset: blockStart + updatedBlock.length,
      ),
    );
  }

  void _insertLink() {
    final selection = _controller.selection;
    final text = _controller.text;
    final start = selection.start < 0 ? text.length : selection.start;
    final end = selection.end < 0 ? text.length : selection.end;
    final selectedText = text.substring(start, end);
    final label = selectedText.isEmpty ? 'link text' : selectedText;
    final replacement = '[$label](https://)';
    final next = text.replaceRange(start, end, replacement);
    final urlStart = start + label.length + 3;

    _controller.value = TextEditingValue(
      text: next,
      selection: TextSelection(
        baseOffset: urlStart,
        extentOffset: urlStart + 8,
      ),
    );
  }
}

class _GhostActionButton extends StatelessWidget {
  const _GhostActionButton({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0x146D28D9),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0x306D28D9)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: AppColors.primary),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyles.smallMedium.copyWith(color: AppColors.primary),
            ),
          ],
        ),
      ),
    );
  }
}

class _FormatChip extends StatelessWidget {
  const _FormatChip({
    required this.label,
    required this.tooltip,
    required this.onTap,
  });

  final String label;
  final String tooltip;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0x146D28D9),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0x306D28D9)),
          ),
          child: Text(
            label,
            style: TextStyles.smallMedium.copyWith(color: AppColors.primary),
          ),
        ),
      ),
    );
  }
}
