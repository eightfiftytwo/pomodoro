/* statistics.js
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
import GLib from 'gi://GLib';
import Template from './statistics.blp' assert { type: 'uri' };
import { format_time } from '../../utils.js';

export default class Statistics extends Adw.Bin {
  static {
    GObject.registerClass({
      Template,
      InternalChildren: [
        'work_time_today',
        'work_time_today_label',
        'work_time_week',
        'work_time_week_label',
        'work_time_month',
        'work_time_month_label',
        'break_time_today_label',
        'break_time_week_label',
        'break_time_month_label',
      ]
    }, this);
  }
  constructor() {
    super();
    this.application = Gtk.Application.get_default();
    this._current_date = GLib.DateTime.new_now_local();
    this._load_statistics_data();
  }
  _load_statistics_data() {
    this._load_work_time();
    this._load_break_time();
  }
  _get_day() {
    return this._current_date.get_day_of_year();
  }
  _get_week() {
    return this._current_date.get_week_of_year();
  }
  _get_month() {
    return this._current_date.get_month();
  }
  _load_work_time() {
    const today = this.application.data.get().filter((item) => item.day === this._get_day())
    const yesterday = this.application.data.get().filter((item) => item.day === this._get_day() - 1);
    const week = this.application.data.get().filter((item) => item.week === this._get_week());
    const last_week = this.application.data.get().filter((item) => item.week === this._get_week() - 1);
    const month = this.application.data.get().filter((item) => item.month === this._get_month());
    const last_month = this.application.data.get().filter((item) => item.month === this._get_month() - 1);
    const work_time_today = today.reduce((accumulator, current_value) => accumulator + current_value.work_time, 0);
    const work_timer_yesterday = yesterday.reduce((accumulator, current_value) => accumulator + current_value.work_time, 0);
    const work_time_week = week.reduce((accumulator, current_value) => accumulator + current_value.work_time, 0);
    const work_timer_last_week = last_week.reduce((accumulator, current_value) => accumulator + current_value.work_time, 0);
    const work_time_month = month.reduce((accumulator, current_value) => accumulator + current_value.work_time, 0);
    const work_timer_last_month = last_month.reduce((accumulator, current_value) => accumulator + current_value.work_time, 0);

    const percentage_work_time_today_yesterday = () => {
      let value = ((work_time_today - work_timer_yesterday) / work_timer_yesterday) * 100;
      value = value ? value : 0
      value = value === Infinity ? 100 : value;
      let adjective = _('more');
      if (value < 0)
        adjective = _('less');
      return `${Math.abs(value).toFixed(0)}% ${adjective} ${_("than yesterday")}`
    }
    const percentage_work_time_week_last_week = () => {
      let value = ((work_time_week - work_timer_last_week) / work_timer_last_week) * 100;
      value = value ? value : 0
      value = value === Infinity ? 100 : value;

      let adjective = _('more');
      if (value < 0)
        adjective = _('less');
      return `${Math.abs(value).toFixed(0)}% ${adjective} ${_("than last week")}`
    }
    const percentage_work_time_month_last_month = () => {
      let value = ((work_time_month - work_timer_last_month) / work_timer_last_month) * 100;
      value = value ? value : 0
      value = value === Infinity ? 100 : value;
      let adjective = _('more');
      if (value < 0)
        adjective = _('less');
      return `${Math.abs(value).toFixed(0)}% ${adjective} ${_("than last month")}`
    }
    this._work_time_today_label.set_text(format_time(work_time_today))
    this._work_time_today.set_subtitle(percentage_work_time_today_yesterday())
    this._work_time_week_label.set_text(format_time(work_time_week))
    this._work_time_week.set_subtitle(percentage_work_time_week_last_week())
    this._work_time_month_label.set_text(format_time(work_time_month));
    this._work_time_month.set_subtitle(percentage_work_time_month_last_month())
  }
  _load_break_time() {
    const today = this.application.data.get().filter((item) => item.day === this._get_day())
    const week = this.application.data.get().filter((item) => item.week === this._get_week());
    const month = this.application.data.get().filter((item) => item.month === this._get_month());

    const break_time_today = today.reduce((accumulator, current_value) => accumulator + current_value.break_time, 0);
    const break_time_week = week.reduce((accumulator, current_value) => accumulator + current_value.break_time, 0);
    const break_time_month = month.reduce((accumulator, current_value) => accumulator + current_value.break_time, 0);

    this._break_time_today_label.set_text(format_time(break_time_today))
    this._break_time_week_label.set_text(format_time(break_time_week))
    this._break_time_month_label.set_text(format_time(break_time_month))
  }
}
