/* window.js
 *
 * Copyright 2023 Ideve Core
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import GObject from 'gi://GObject';
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import { Timer } from './pages/timer/timer.js';
import { Statistics } from './pages/statistics/statistics.js';
import { ThemeSelector } from './components/theme-selector/theme-selector.js';
import Shortcuts from './components/shortcuts/shortcuts.js';
import { SmallWindow } from './components/small-window/small-window.js';
import Template from './window.blp' assert { type: 'uri' };

/**
 *
 * Create Window page
 * @class
 * @extends {Adw.ApplicationWindow}
 *
 */
export class Window extends Adw.ApplicationWindow {
  static {
    GObject.registerClass({
      Template,
      GTypeName: 'Window',
      InternalChildren: [
        'stack',
        'shorten_window',
        'menu_button',
        'toast_overlay',
        'statistics_page',
        'timer_page',
      ],
    }, this);
  }

  /**
   *
   * Create a instance of pomodoro main window
   * @param {Adw.ApplicationWindow} application
   *
   */
  constructor(application) {
    super({ application });

    const theme_selector = new ThemeSelector({ application });
    this._menu_button.get_popover().add_child(theme_selector, 'theme');
    this.set_help_overlay(new Shortcuts(application));
    this._timer_page.set_child(new Timer({ application }));
    this._statistics_page_component = new Statistics({ application });
    this._statistics_page.set_child(this._statistics_page_component);
    this._small_window = new SmallWindow({ application });
    this._timer = application.utils.timer;
    this.application = application;

    this._timer.connect('start', () => {
      this._shorten_window.set_sensitive(true);
    });
    this._timer.connect('stop', () => {
      this._shorten_window.set_sensitive(false);
    });
    this.connect('close-request', () => {
      application.quit_request();
      return true;
    });
    this._stack.connect('notify::visible-child', () => {
      if (this._stack.visible_child_name == 'statistics') {
        this._statistics_page_component.load_statistics_data();
      }
    });

    this._setup_actions();
    this._small_window.insert_action_group("window", this.window_group);
    this._shorten_window.set_sensitive(false);
  }

  /**
   *
   * Setup actions
   *
   */
  _setup_actions() {
    const toggle_small_window = new Gio.SimpleAction({ name: 'toggle-small-window', parameter_type: new GLib.Variant('s', '').get_type() });
    this.window_group = new Gio.SimpleActionGroup();

    toggle_small_window.connect('activate', (simple_action, parameter) => {
      const value = parameter.get_string()[0];
      if (value === 'open') {
        this.hide();
        this._small_window.show();
      } else {
        this._small_window.hide();
        this.show();
      }
    });
    this.add_action(toggle_small_window);
    this.window_group.add_action(toggle_small_window)
  }
}
