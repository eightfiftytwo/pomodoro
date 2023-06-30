/* timer.js
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
import Gtk from 'gi://Gtk';
import GLib from 'gi://GLib';
import { timer_state, data } from './stores.js';
import { Application_data, Application_notify, Sound, set_background_status } from './utils.js';

export const Timer = GObject.registerClass({
  GTypeName: "Timer",
  Template: 'resource:///io/gitlab/idevecore/Pomodoro/ui/timer.ui',
  InternalChildren: [
    'title_entry',
    'description_entry',
    'timer_label',
    'stack_timer_controls',
  ],
}, class Timer extends Adw.Bin {
  constructor() {
    super();
    this._timer_running = false;
    this._break_timer = 300; //seconds
    this._timer = 1500; //seconds
    this._is_break_timer = false;
    this._timer_state = null;
    this.application = Gtk.Application.get_default();
  }
  switch_class_errror(element) {
    if (element.get_text() === '') {
      element.get_style_context().add_class('error')
      element.set_title(`${element.get_title().split(' ')[0]} ${_("invalid")}`)
      return
    }
    element.get_style_context().remove_class('error')
    element.set_title(element.get_title().split(' ')[0])
  }

  handler_timer() {
    const title = this._title_entry.get_text();
    const description = this._description_entry.get_text();

    this.switch_class_errror(this._title_entry)
    this.switch_class_errror(this._description_entry)

    if (title !== '' && description !== '') {
      timer_state.subscribe((value) => {
        value === 'stopped' || value === 'paused' ? timer_state.update(() => ('running')) : timer_state.update(() => ('paused'))
      })
      timer_state.subscribe((value) => {
        this._title_entry.editable = false;
        this._description_entry.editable = false;
        if (value === 'running') {
          if (!this._timer_running) {
            const current_date = GLib.DateTime.new_now_local()
            this._data = {
              title,
              description,
              work_time: 0,
              break_time: 0,
              date: {
                day: current_date.get_day_of_year(),
                week: current_date.get_week_of_year(),
                month: current_date.get_month(),
                display_date: this.get_date(),
              },
              id: GLib.uuid_string_random(),
              counts: 0,
            }
            this._timer_running = true;
            GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
              timer_state.subscribe((value) => {
                this._timer_state = value
              })
              if (this._timer_state === 'stopped') {
                data.subscribe((value) => {
                  if (!this._data)
                    return
                  const array = value
                  array.push(this._data)
                  data.update(() => (array))
                  new Application_data().save()
                })
                this._data = null;
                return GLib.SOURCE_REMOVE
              }
              if (this._timer_state === 'paused') {
                if (!this.application.active_window.visible)
                  set_background_status(`Paused timer`)
                return GLib.SOURCE_CONTINUE
              }

              this._timer--

              if (this._timer === 1499) {
                this._timer_label.get_style_context().remove_class('error');
                new Application_notify({ title: `${_("Pomodoro started")} - ${this._data.title}`, body: `${_("Description")}: ${this._data.description}\n${_("Created date")}: ${this._data.date.display_date}` })
              } else if (this._timer === 0) {
                this._timer_label.get_style_context().add_class('error');
                new Application_notify({ title: `${_("Pomodoro break time")} - ${this._data.title}`, body: `${_("Description")}: ${this._data.description}\n${_("Created date")}: ${this._data.date.display_date}` })
                new Sound({ name: 'complete', cancellable: null }).play();
              }

              if (this._timer > 0) {
                this._data.work_time = this._data.work_time + 1
                if (!this.application.active_window.visible)
                  set_background_status(`Work time: ${this.format_timer()}`)
              } else {
                this._data.break_time = this._data.break_time + 1
                if (!this.application.active_window.visible)
                  set_background_status(`Break time: ${this.format_timer()}`)
              }

              this._timer_label.set_text(this.format_timer())

              if (this._timer > (this._break_timer * -1)) {
                return GLib.SOURCE_CONTINUE
              }
              timer_state.update(() => 'paused')
              this._stack_timer_controls.visible_child_name = 'paused_timer';
              this._timer = 1500
              this._data.counts = this._data.counts + 1
              if (this._data.counts === 3) {
                this._break_timer = 900
              }
              new Application_notify({ title: `${_("Pomodoro finished")} - ${this._data.title}`, body: `${_("Description")}: ${this._data.description}\n${_("Created date")}: ${this._data.date.display_date}` })
              this._timer_label.get_style_context().remove_class('error');
              new Sound({ name: 'alarm-clock-elapsed', cancellable: null }).play();
              this._timer_label.set_text(this.format_timer());
              return GLib.SOURCE_CONTINUE
            })
          }
          this._stack_timer_controls.visible_child_name = 'running_timer';
        } else {
          this._stack_timer_controls.visible_child_name = 'paused_timer';
        }
      })
    }
  }
  reset_timer() {
    this._timer_running = false;
    this._timer = 1500;
    this._break_timer = 300;
    this._title_entry.editable = true;
    this._description_entry.editable = true;
    this._stack_timer_controls.visible_child_name = 'init_timer';
    this._data = null;
    this._timer_label.get_style_context().remove_class('error');
    this._timer_label.set_text(this.format_timer());
    timer_state.update(() => ('stopped'));
  }
  stop_timer() {
    this._timer_running = false;
    this._title_entry.set_text('');
    this._description_entry.set_text('');
    this._break_timer = 300;
    this._timer = 1500;
    this._title_entry.editable = true;
    this._description_entry.editable = true;
    this._stack_timer_controls.visible_child_name = 'init_timer';
    this._timer_label.get_style_context().remove_class('error');
    this._timer_label.set_text(this.format_timer());
    data.subscribe((value) => {
      if (!this._data)
        return
      const array = value;
      array.push(this._data);
      data.update(() => (array));
      new Application_data().save();
    });
    this._data = null;
    timer_state.update(() => ('stopped'));
  }
  get_date() {
    const current_date = GLib.DateTime.new_now_local();
    const day_of_week = current_date.format('%A');
    const day_of_month = current_date.get_day_of_month();
    const month_of_year = current_date.format('%B');
    const year = current_date.get_year();
    return `${day_of_week}, ${day_of_month} ${_("of")} ${month_of_year} ${_("of")} ${year}`
  }
  format_timer() {
    let hours = Math.floor(Math.abs(this._timer < 0 ? this._timer + this._break_timer : this._timer) / 60 / 60)
    let minutes = Math.floor(Math.abs(this._timer < 0 ? this._timer + this._break_timer : this._timer) / 60) % 60;
    let seconds = Math.abs(this._timer < 0 ? this._timer + this._break_timer : this._timer) % 60;

    if (hours.toString().split('').length < 2) {
      hours = `0${hours}`
    }
    if (minutes.toString().split('').length < 2) {
      minutes = `0${minutes}`
    }
    if (seconds.toString().split('').length < 2) {
      seconds = `0${seconds}`
    }
    return `${hours}:${minutes}:${seconds}`
  }
})
