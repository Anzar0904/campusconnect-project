import os
import re

# Mapping from Material Symbols string keys to Lucide React component names
MAPPING = {
    'add': 'Plus',
    'add_circle': 'PlusCircle',
    'add_photo_alternate': 'ImagePlus',
    'admin_panel_settings': 'Shield',
    'arrow_back': 'ArrowLeft',
    'arrow_forward': 'ArrowRight',
    'bookmark': 'Bookmark',
    'business_center': 'Briefcase',
    'calendar_month': 'Calendar',
    'campaign': 'Megaphone',
    'chat': 'MessageCircle',
    'chat_bubble': 'MessageSquare',
    'chat_bubble_outline': 'MessageSquare',
    'check': 'Check',
    'check_circle': 'CheckCircle',
    'chevron_left': 'ChevronLeft',
    'chevron_right': 'ChevronRight',
    'close': 'X',
    'code': 'Code2',
    'dashboard': 'LayoutDashboard',
    'delete': 'Trash2',
    'description': 'FileText',
    'diversity_3': 'Users',
    'domain': 'Building2',
    'download': 'Download',
    'edit': 'Edit2',
    'emoji_events': 'Trophy',
    'error': 'AlertCircle',
    'event': 'Calendar',
    'favorite': 'Heart',
    'favorite_border': 'Heart',
    'feed': 'Rss',
    'file_upload': 'Upload',
    'forum': 'MessageSquare',
    'gavel': 'Scale',
    'group': 'Users',
    'group_add': 'UserPlus',
    'group_off': 'UserX',
    'groups': 'Users',
    'gpp_maybe': 'ShieldAlert',
    'help_outline': 'HelpCircle',
    'home': 'Home',
    'hub': 'Network',
    'info': 'Info',
    'local_fire_department': 'Flame',
    'location_on': 'MapPin',
    'lock': 'Lock',
    'lock_open': 'LockOpen',
    'logout': 'LogOut',
    'mail': 'Mail',
    'mark_email_read': 'MailCheck',
    'menu_book': 'BookOpen',
    'more_vert': 'MoreVertical',
    'notifications': 'Bell',
    'notifications_active': 'BellRing',
    'open_in_new': 'ExternalLink',
    'person': 'User',
    'person_add': 'UserPlus',
    'person_remove': 'UserMinus',
    'photo_library': 'Image',
    'photo_camera': 'Camera',
    'play_arrow': 'Play',
    'psychology': 'Brain',
    'refresh': 'RefreshCw',
    'rocket_launch': 'Rocket',
    'save': 'Save',
    'schedule': 'Clock',
    'school': 'GraduationCap',
    'search': 'Search',
    'search_off': 'SearchX',
    'security': 'Shield',
    'sell': 'Tag',
    'send': 'Send',
    'settings': 'Settings',
    'share': 'Share2',
    'smart_toy': 'Bot',
    'sports_esports': 'Gamepad2',
    'star': 'Star',
    'storefront': 'Store',
    'support_agent': 'Headphones',
    'thumb_up': 'ThumbsUp',
    'travel_explore': 'Compass',
    'upload': 'Upload',
    'upload_file': 'UploadCloud',
    'verified': 'CheckCircle',
    'verified_user': 'ShieldCheck',
    'visibility': 'Eye',
    'visibility_off': 'EyeOff',
    'waving_hand': 'Hand',
    'work_outline': 'Briefcase',
}

files_to_migrate = [
    "src/app/(app)/placements/PlacementsClient.tsx",
    "src/app/(app)/study/StudyClient.tsx",
    "src/app/(app)/messages/MessagesClient.tsx",
    "src/app/(app)/messages/error.tsx",
    "src/app/(app)/discover/DiscoverClient.tsx",
    "src/app/(app)/clubs/ClubsClient.tsx",
    "src/app/(app)/calendar/CalendarClient.tsx",
    "src/app/(app)/papers/PapersClient.tsx",
    "src/app/(app)/marketplace/MarketplaceClient.tsx",
    "src/app/(app)/marketplace/error.tsx",
    "src/app/(app)/rewards/RewardsClient.tsx",
    "src/app/(app)/internships/InternshipsClient.tsx",
    "src/app/(app)/super-admin/SuperAdminClient.tsx",
    "src/app/(app)/notes/NotesClient.tsx",
    "src/app/(app)/profile/ProfileClient.tsx",
    "src/app/(app)/coding-arena/CodingArenaClient.tsx",
    "src/app/(app)/ai/AIAssistantClient.tsx",
    "src/app/(app)/mentorship/MentorshipClient.tsx",
    "src/app/(app)/friends/FriendsClient.tsx",
    "src/app/(app)/events/EventsClient.tsx",
    "src/app/(app)/events/error.tsx",
    "src/app/(app)/dating/DatingClient.tsx",
    "src/app/(app)/dating/page.tsx",
    "src/app/(app)/community/CommunitiesClient.tsx",
    "src/app/(app)/startup/StartupClient.tsx",
    "src/app/auth/verify/page.tsx",
    "src/app/auth/login/page.tsx",
    "src/app/dashboard/error.tsx",
    "src/app/error.tsx",
    "src/app/legal/privacy-and-terms/page.tsx",
    "src/components/layout/BottomNav.tsx",
    "src/components/layout/Sidebar.tsx",
]

def migrate_file(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all span matches
    # Patterns like: <span className="material-symbols-outlined text-[16px]">add</span>
    # Or: <span className="material-symbols-outlined text-[16px]" style={{...}}>add</span>
    # Or: <span className="material-symbols-outlined ...">{variable}</span>
    
    # We will search for all material-symbols-outlined spans
    span_pattern = re.compile(
        r'<span\s+className=["\']material-symbols-outlined\s*([^"\']*)["\']([^>]*?)>([^<]+?)</span>'
    )
    
    matches = span_pattern.findall(content)
    if not matches:
        return

    print(f"Migrating {filepath} ({len(matches)} spans found)...")
    new_icons_needed = set()
    
    def replacer(match):
        classes = match.group(1).strip()
        extra_attrs = match.group(2).strip()
        icon_text = match.group(3).strip()

        # Handle simple curly bracket variables or direct strings
        # If it's a dynamic variable (e.g. {CAT_ICONS[club.category]})
        # we might have trouble mapping it statically. But let's see.
        if icon_text.startswith('{') and icon_text.endswith('}'):
            # It's a dynamic icon! We need to handle this specially or fallback.
            # E.g. {s.icon} or {CAT_ICONS[selected.category]}
            # Let's map it to a dynamic component if possible, or print warning.
            # For now, let's keep it as is or replace with an Inbox fallback, or map it.
            # Wait, let's see how many dynamic icons there are:
            # - {CAT_ICONS[club.category]}
            # - {s.icon}
            # - {selected.category}
            # Let's see if we can convert it to render a dynamic Lucide component or keep a helper.
            # Actually, let's see if we can map the dictionary values in the file!
            # E.g. CAT_ICONS is defined at the top of ClubsClient.tsx as a dictionary of strings.
            # We can change that dictionary to refer to Lucide components instead of strings!
            # Let's see if the text inside matches any key in MAPPING:
            inner = icon_text[1:-1].strip()
            # If it's just a variable lookup, we can try to rewrite it.
            # E.g., if we map CAT_ICONS keys to Lucide icons, then we can render:
            # const Icon = CAT_ICONS[category]; <Icon className="..." />
            print(f"  WARNING: Dynamic icon expression found: {icon_text}")
            # For dynamic ones, we'll replace with a fallback placeholder Lucide icon and log it for manual verification,
            # OR we can rewrite the dynamic expressions to uppercase the lookup.
            # Let's see: we can map the expression if we know the lookup.
            # Let's map it to: `<span className="lucide-dynamic-placeholder">` for now, or just map common dynamic lookups.
            # Let's write the span replacement:
            return match.group(0)

        if icon_text not in MAPPING:
            print(f"  ERROR: Unmapped Material Symbol: '{icon_text}'")
            return match.group(0)

        lucide_name = MAPPING[icon_text]
        new_icons_needed.add(lucide_name)

        # Parse classes to estimate size. E.g. text-[16px] -> size={16}
        size = 18 # default
        size_match = re.search(r'text-\[(\d+)px\]', classes)
        if size_match:
            size = int(size_match.group(1))
        else:
            # check text-lg, text-xl, etc.
            if 'text-xs' in classes: size = 12
            elif 'text-sm' in classes: size = 14
            elif 'text-base' in classes: size = 16
            elif 'text-lg' in classes: size = 18
            elif 'text-xl' in classes: size = 20
            elif 'text-2xl' in classes: size = 24
            elif 'text-3xl' in classes: size = 30
            elif 'text-[36px]' in classes: size = 36
            elif 'text-[40px]' in classes: size = 40
            elif 'text-[48px]' in classes: size = 48
            elif 'text-[80px]' in classes: size = 80

        # Strip text size classes from className since Lucide uses 'size' attribute
        clean_classes = re.sub(r'text-\[(\d+)px\]', '', classes)
        clean_classes = re.sub(r'text-(xs|sm|base|lg|xl|2xl|3xl)', '', clean_classes)
        clean_classes = clean_classes.strip()

        class_prop = f'className="{clean_classes}" ' if clean_classes else ''
        
        # Style attribute extraction
        style_prop = ''
        if 'style=' in extra_attrs:
            style_match = re.search(r'style=(\{\{[^}]*\}\})', extra_attrs)
            if style_match:
                style_prop = f'style={style_match.group(1)} '
            else:
                style_match_single = re.search(r'style=(\{[^}]*\})', extra_attrs)
                if style_match_single:
                    style_prop = f'style={style_match_single.group(1)} '

        return f'<{lucide_name} {class_prop}{style_prop}size={{{size}}} />'

    new_content = span_pattern.sub(replacer, content)

    if new_icons_needed:
        # We need to insert the import statement or update it
        # Look for import { ... } from 'lucide-react'
        lucide_import_pattern = re.compile(r'import\s+\{\s*([^}]+)\s*\}\s+from\s+["\']lucide-react["\']')
        import_match = lucide_import_pattern.search(new_content)
        
        if import_match:
            existing_imports = set([x.strip() for x in import_match.group(1).split(',') if x.strip()])
            updated_imports = existing_imports.union(new_icons_needed)
            import_str = f"import {{ {', '.join(sorted(list(updated_imports)))} }} from 'lucide-react'"
            new_content = lucide_import_pattern.sub(import_str, new_content)
        else:
            # Find a good place to insert import - e.g. after 'use client' or at the very top
            import_str = f"import {{ {', '.join(sorted(list(new_icons_needed)))} }} from 'lucide-react'\n"
            if new_content.startswith("'use client'") or new_content.startswith('"use client"'):
                # insert after first line
                lines = new_content.split('\n')
                lines.insert(1, import_str)
                new_content = '\n'.join(lines)
            else:
                new_content = import_str + new_content

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

for fp in files_to_migrate:
    migrate_file(fp)
