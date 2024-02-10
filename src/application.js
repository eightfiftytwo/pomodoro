/* application.js
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

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import { gettext as _ } from 'gettext';
import Style from './assets/style.css';
import { Window } from './window.js';
import { SmallWindow } from './components/small-window/small-window.js';
import { application_actions } from './actions.js';
import { utils } from './utils.js';

let provider;

export const application = new Adw.Application({
  application_id: pkg.name,
  flags: Gio.ApplicationFlags.DEFAULT_FLAGS,
  resource_base_path: '/io/gitlab/idevecore/Pomodoro',
});

/**
 *
 * Application utils
 * @type {utils}
 *
 */
application.utils = utils({ application });
application.quit_request = () => {
  const run_in_background = application.utils.settings.get_boolean('run-in-background');
  if (!run_in_background) {
    application.utils.quit_request_dialog.open();
    return;
  }
  if (application.utils.timer.get_data().timer_state === 'stopped') {
    application.quit();
    return;
  }
  application.active_window.hide();
  if (application.active_window) return;
}

/**
 *
 * Is called up when the application is started.
 *
 */
application.connect("activate", () => {
  create_main_window(application);
});

/**
 *
 * Create main window
 * @param {Adw.Application} application
 *
 */
const create_main_window = (application) => {
  let { active_window } = application;
  const settings = application.utils.settings;
  if (!active_window) {
    active_window = new Window(application);
    settings.bind(
      "width",
      active_window,
      "default-width",
      Gio.SettingsBindFlags.DEFAULT,
    );
    settings.bind(
      "height",
      active_window,
      "default-height",
      Gio.SettingsBindFlags.DEFAULT,
    );
    settings.bind(
      "is-maximized",
      active_window,
      "maximized",
      Gio.SettingsBindFlags.DEFAULT,
    );
    settings.bind(
      "is-fullscreen",
      active_window,
      "fullscreened",
      Gio.SettingsBindFlags.DEFAULT,
    );
  }
  active_window.present();

  // Load styles in app
  if (!provider) {
    provider = new Gtk.CssProvider();
    provider.load_from_resource(Style);
    Gtk.StyleContext.add_provider_for_display(
      Gdk.Display.get_default(),
      provider,
      Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION,
    );
  }
}

// Setup application actions
application_actions({ application });
