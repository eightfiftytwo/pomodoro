/* small-window.js
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
import { TimerControls } from '../timer-controls/timer-controls.js';
import { DisplayTimer } from '../display-timer/display-timer.js';
import Template from './small-window.blp' assert { type: 'uri' };

/**
 * 
 * Create HistoryRow element
 * @class
 * @extends {Adw.Window}
 *
 */
export class SmallWindow extends Adw.Window {
  static {
    GObject.registerClass({
      Template,
      GTypeName: 'SmallWindow',
      InternalChildren: [
        'overlay',
        'overlay_controls',
        'timer_controls_container',
        'display_timer_container',
      ],
    }, this);
  }

  /**
   *
   * Create SmallWindow element
   * @param {object} params
   * @param {Adw.Applicatioon} params.application
   */
  constructor({ application  }) {
    super();
    this._timer = application.utils.timer;
    this._timer_controls_container.append(new TimerControls({application}));
    this._display_timer_container.append(new DisplayTimer({ application }));

    this._timer.connect('stop', () => {
      application.get_active_window().present();
      this.hide();
    });
    this._setup_event_controller();
  }

  /**
   *
   * Setup event controls (Mouse enter|leave)...
   *
   */
  _setup_event_controller() {
    const controller = new Gtk.EventControllerMotion();
    controller.connect("enter", () => {
      this._overlay_controls.set_opacity(1);
    })
    controller.connect("leave", () => {
      this._overlay_controls.set_opacity(0);
    })
    this._overlay.add_controller(controller)
  }
}

