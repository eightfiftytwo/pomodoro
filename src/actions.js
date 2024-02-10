/* actions.js
 *
 * Copyright 2023 Ideve Core
 *
 * Application program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Application program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with application program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import { create_about_params } from './about.js';
import { Preferences } from './components/preferences/preferences.js';
import { History } from './components/history/history.js';

/**
 *
 * Setup application actions
 * @param {object} params
 * @param {Adw.Application} params.application
 *
 */
export const application_actions = ({ application }) => {
  const quit_action = new Gio.SimpleAction({ name: 'quit' });
  const preferences_action = new Gio.SimpleAction({ name: 'preferences' });
  const history_action = new Gio.SimpleAction({ name: 'history' });
  const show_about_action = new Gio.SimpleAction({ name: 'about' });
  const active_action = new Gio.SimpleAction({ name: 'open' });

  quit_action.connect('activate', () => {
    if (application.get_active_window().visible) {
      application.quit_request();
    } else {
      application.utils.quit_request_dialog.open();
    }
  });

  preferences_action.connect('activate', () => {
    new Preferences({ application }).present();
  });

  history_action.connect('activate', () => {
    new History({ application }).present();
  });

  show_about_action.connect('activate', () => {
    new Adw.AboutWindow(create_about_params({application})).present();
  });

  active_action.connect("activate", () => {
    application.get_active_window()._small_window.hide();
    application.active_window.show();
  });

  application.add_action(quit_action);
  application.add_action(preferences_action);
  application.add_action(history_action);
  application.add_action(show_about_action);
  application.add_action(active_action);
  application.set_accels_for_action('app.quit', ['<primary>q']);
  application.set_accels_for_action('win.show-help-overlay', ['<Primary>question']);
  application.set_accels_for_action('app.history', ['<Primary>h']);
  application.set_accels_for_action('app.preferences', ['<Primary>comma']);
}
