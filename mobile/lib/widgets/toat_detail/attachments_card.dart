import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import 'package:toatre/config/app_config.dart';
import 'package:toatre/models/toat_summary.dart';
import 'package:toatre/services/api_service.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';
import 'package:toatre/widgets/toat_detail/section_card.dart';

class AttachmentsCard extends StatelessWidget {
  const AttachmentsCard({
    super.key,
    required this.toatId,
    required this.attachments,
  });

  final String toatId;
  final List<ToatAttachment> attachments;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      title: 'Attachments (${attachments.length})',
      child: Column(
        children: [
          for (var index = 0; index < attachments.length; index++) ...[
            _AttachmentTile(toatId: toatId, attachment: attachments[index]),
            if (index != attachments.length - 1) const SizedBox(height: 12),
          ],
        ],
      ),
    );
  }
}

class _AttachmentTile extends StatefulWidget {
  const _AttachmentTile({required this.toatId, required this.attachment});

  final String toatId;
  final ToatAttachment attachment;

  @override
  State<_AttachmentTile> createState() => _AttachmentTileState();
}

class _AttachmentTileState extends State<_AttachmentTile> {
  late final Future<Map<String, String>> _headersFuture;
  bool _saving = false;

  String get _url => AppConfig.apiUri(
    '/api/toats/${widget.toatId}/attachments/${widget.attachment.id}',
  ).toString();

  @override
  void initState() {
    super.initState();
    _headersFuture = ApiService.instance.authenticatedHeaders();
  }

  @override
  Widget build(BuildContext context) {
    final attachment = widget.attachment;
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFFFFDF8),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE7DED0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (attachment.isImage)
            FutureBuilder<Map<String, String>>(
              future: _headersFuture,
              builder: (context, snapshot) {
                final headers = snapshot.data;
                return ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(18),
                  ),
                  child: AspectRatio(
                    aspectRatio: 16 / 9,
                    child: headers == null
                        ? Container(
                            color: const Color(0xFFF4EFE8),
                            alignment: Alignment.center,
                            child: const CircularProgressIndicator(
                              strokeWidth: 2,
                            ),
                          )
                        : Image.network(
                            _url,
                            headers: headers,
                            fit: BoxFit.cover,
                            loadingBuilder: (_, child, progress) {
                              if (progress == null) return child;
                              return Container(
                                color: const Color(0xFFF4EFE8),
                                alignment: Alignment.center,
                                child: const CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              );
                            },
                            errorBuilder: (_, __, ___) => Container(
                              color: const Color(0xFFF4EFE8),
                              alignment: Alignment.center,
                              child: const Icon(
                                Icons.image_outlined,
                                color: AppColors.textMuted,
                                size: 34,
                              ),
                            ),
                          ),
                  ),
                );
              },
            ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: const Color(0x14BE7716),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  alignment: Alignment.center,
                  child: Icon(
                    attachment.isImage
                        ? Icons.image_rounded
                        : Icons.description_rounded,
                    color: const Color(0xFFBE7716),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    attachment.label,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyles.bodyMedium.copyWith(
                      color: AppColors.text,
                      height: 1.35,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                if (attachment.isImage)
                  _ActionPill(label: 'View', onTap: _showPreview),
                const SizedBox(width: 8),
                _ActionPill(
                  label: _saving ? 'Saving...' : 'Save',
                  filled: true,
                  onTap: _saving ? null : _shareAttachment,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showPreview() async {
    final headers = await _headersFuture;
    if (!mounted) {
      return;
    }
    await showDialog<void>(
      context: context,
      builder: (context) => Dialog.fullscreen(
        backgroundColor: Colors.black,
        child: Stack(
          children: [
            Center(
              child: InteractiveViewer(
                minScale: 0.8,
                maxScale: 4,
                child: Image.network(
                  _url,
                  headers: headers,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => const Icon(
                    Icons.broken_image_outlined,
                    color: Colors.white,
                    size: 42,
                  ),
                ),
              ),
            ),
            Positioned(
              top: 16,
              right: 16,
              child: IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.close_rounded, color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _shareAttachment() async {
    setState(() => _saving = true);
    try {
      final headers = await _headersFuture;
      final response = await http.get(Uri.parse(_url), headers: headers);
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw const ApiServiceException(
          statusCode: 500,
          message: 'Could not download this attachment.',
        );
      }

      final tempDir = await getTemporaryDirectory();
      final file = File(
        '${tempDir.path}/${_safeFileName(widget.attachment.label, widget.attachment.mimeType)}',
      );
      await file.writeAsBytes(response.bodyBytes, flush: true);

      await Share.shareXFiles(
        [XFile(file.path)],
        text: widget.attachment.label,
        subject: widget.attachment.label,
      );
    } catch (_) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not save this attachment.')),
      );
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }

  String _safeFileName(String label, String mimeType) {
    final base = label
        .trim()
        .toLowerCase()
        .replaceAll(RegExp(r'[^a-z0-9]+'), '_')
        .replaceAll(RegExp(r'^_+|_+$'), '');
    final ext = _extensionForMimeType(mimeType);
    return '${base.isEmpty ? 'attachment' : base}$ext';
  }

  String _extensionForMimeType(String mimeType) {
    switch (mimeType) {
      case 'image/jpeg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      case 'image/gif':
        return '.gif';
      case 'application/pdf':
        return '.pdf';
      default:
        return '';
    }
  }
}

class _ActionPill extends StatelessWidget {
  const _ActionPill({
    required this.label,
    required this.onTap,
    this.filled = false,
  });

  final String label;
  final VoidCallback? onTap;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    final foreground = filled ? const Color(0xFFBE7716) : AppColors.text;
    final background = filled ? const Color(0x14BE7716) : Colors.white;
    final borderColor = filled
        ? const Color(0x30BE7716)
        : const Color(0xFFE7DED0);

    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderColor),
        ),
        child: Text(
          label,
          style: TextStyles.smallMedium.copyWith(color: foreground),
        ),
      ),
    );
  }
}
