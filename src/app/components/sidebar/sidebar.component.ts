import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from '../../models/menu.model';
import { MENU_ITEMS } from '../../config/menu.config';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  menuItems = signal<MenuItem[]>(MENU_ITEMS);
  isCollapsed = signal<boolean>(false);

  private router = inject(Router);

  toggleSidebar() {
    this.isCollapsed.update(v => !v);
  }

  toggleSubmenu(item: MenuItem) {
    if (this.isCollapsed()) {
      this.isCollapsed.set(false);
      setTimeout(() => {
        item.expanded = !item.expanded;
      }, 150); // Small delay for smooth transition
    } else {
      item.expanded = !item.expanded;
    }
  }

  logout() {
    this.router.navigate(['/login']);
  }
}
