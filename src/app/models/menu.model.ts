export interface MenuItem {
    label: string;
    icon: string; // SVG path or identifier
    route?: string;
    children?: MenuItem[];
    expanded?: boolean; // UI state for submenu expansion
}
