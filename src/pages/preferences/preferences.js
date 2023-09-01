/* preferences.js
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
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Template from './preferences.blp' assert { type: 'uri' };

export default class Preferences extends Adw.PreferencesWindow {
  static {
    GObject.registerClass({
      Template,
      InternalChildren: [
        'switch_run_in_background',
        'switch_play_sounds',
        'set_long_break',
        'set_break_time',
        'set_work_time',
        'set_sessions_long_break',
        'switch_autostart',
        'set_history_duration',
      ],
    }, this);
  }
  constructor(application) {
    super();
    this.Application = application;
    this.transient_for = this.Application.active_window;
    this._switch_run_in_background.set_active(this.Application.settings.get_boolean('run-in-background'));
    this._switch_play_sounds.set_active(this.Application.settings.get_boolean('play-sounds'));

    this.work_time = this.Application.settings.get_int('work-time');
    this.break_time = this.Application.settings.get_int('break-time');
    this.long_break = this.Application.settings.get_int('long-break');
    this.sessions_long_break = this.Application.settings.get_int('sessions-long-break');
    this._set_work_time.set_value(Math.floor(this.work_time / 60) % 60);
    this._set_break_time.set_value(Math.floor(this.break_time / 60) % 60);
    this._set_long_break.set_value(Math.floor(this.long_break / 60) % 60);
    this._set_sessions_long_break.set_value(this.sessions_long_break);
    this._set_settings_bind_states();
  }
  _set_settings_bind_states() {
    this.Application.settings.bind(
      "autostart",
      this._switch_autostart,
      "active",
      Gio.SettingsBindFlags.DEFAULT,
    );
    this.Application.settings.bind(
      "history-duration",
      this._set_history_duration,
      "value",
      Gio.SettingsBindFlags.DEFAULT,
    );
  }
  _on_boolean_state_set(widget, state) {
    const setting = widget.get_name()
    this.Application.settings.set_boolean(setting, state)
  }
  _on_work_time_changed(_spin_button) {
    this.Application.settings.set_int('work-time', _spin_button.get_value() * 60)
  }
  _on_break_time_changed(_spin_button) {
    this.Application.settings.set_int('break-time', _spin_button.get_value() * 60)
  }
  _on_long_break_changed(_spin_button) {
    this.Application.settings.set_int('long-break', _spin_button.get_value() * 60)
  }
  _on_sessions_long_break_changed(_spin_button) {
    this.Application.settings.set_int('sessions-long-break', _spin_button.get_value())
  }
}
