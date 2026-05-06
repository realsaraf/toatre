import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:toatre/config/app_config.dart';
import 'package:toatre/utils/app_colors.dart';
import 'package:toatre/utils/text_styles.dart';

/// Google Places Autocomplete search panel shown inside a [Dialog].
class LocationSearchContent extends StatefulWidget {
  const LocationSearchContent({super.key, required this.onSelect});

  final void Function(String description) onSelect;

  @override
  State<LocationSearchContent> createState() => _LocationSearchContentState();
}

class _LocationSearchContentState extends State<LocationSearchContent> {
  final _ctrl = TextEditingController();
  Timer? _debounce;
  List<Map<String, String>> _suggestions = [];
  bool _searching = false;

  @override
  void dispose() {
    _ctrl.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onQueryChanged(String q) {
    _debounce?.cancel();
    if (q.trim().isEmpty) {
      setState(() => _suggestions = []);
      return;
    }
    _debounce = Timer(
      const Duration(milliseconds: 300),
      () => _fetchSuggestions(q),
    );
  }

  Future<void> _fetchSuggestions(String q) async {
    setState(() => _searching = true);
    try {
      final uri = AppConfig.apiUri(
        '/api/places/autocomplete',
        queryParameters: {'q': q},
      );
      final response = await http.get(uri);
      if (!mounted) return;
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      final predictions = (body['predictions'] as List<dynamic>? ?? [])
          .map(
            (p) => <String, String>{
              'placeId':
                  (p as Map<String, dynamic>)['place_id'] as String? ?? '',
              'description': p['description'] as String? ?? '',
            },
          )
          .where((p) => p['description']!.isNotEmpty)
          .toList();
      setState(() {
        _suggestions = predictions;
        _searching = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _searching = false;
          _suggestions = [];
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 8, 0),
          child: Row(
            children: [
              Text('Add location', style: TextStyles.heading3),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.close_rounded),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: TextField(
            controller: _ctrl,
            autofocus: true,
            onChanged: _onQueryChanged,
            decoration: InputDecoration(
              hintText: 'Search for a place or address…',
              prefixIcon: const Icon(Icons.search_rounded, size: 20),
              suffixIcon: _searching
                  ? const Padding(
                      padding: EdgeInsets.all(12),
                      child: SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    )
                  : null,
              filled: true,
              fillColor: AppColors.bgSecondary,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 14,
                vertical: 12,
              ),
            ),
          ),
        ),
        Flexible(
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: _suggestions.length,
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            itemBuilder: (context, index) {
              final s = _suggestions[index];
              return ListTile(
                leading: const Icon(
                  Icons.location_on_rounded,
                  color: AppColors.primary,
                ),
                title: Text(s['description'] ?? '', style: TextStyles.body),
                onTap: () => widget.onSelect(s['description'] ?? ''),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 8),
      ],
    );
  }
}
