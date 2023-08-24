/* utils.js
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

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Gtk from 'gi://Gtk';
import GObject from 'gi://GObject';

export const format_time = (timer) => {
  let hours = Math.floor(timer / 60 / 60)
  let minutes = Math.floor(timer / 60) % 60;
  let seconds = timer % 60;
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

const History_list_object = GObject.registerClass(
  {
    Properties: {
      title: GObject.ParamSpec.string(
        "title",
        '',
        '',
        GObject.ParamFlags.READWRITE,
        '',
      ),
      subtitle: GObject.ParamSpec.string(
        "subtitle",
        '',
        '',
        GObject.ParamFlags.READWRITE,
        '',
      ),
      work_time: GObject.ParamSpec.int(
        "work_time",
        '',
        '',
        GObject.ParamFlags.READWRITE,
        0, 172800, 0,
      ),
      break_time: GObject.ParamSpec.int(
        "break_time",
        '',
        '',
        GObject.ParamFlags.READWRITE,
        0, 172800, 0,
      ),
      description: GObject.ParamSpec.string(
        "description",
        '',
        '',
        GObject.ParamFlags.READWRITE,
        '',
      ),
      counts: GObject.ParamSpec.string(
        "counts",
        '',
        '',
        GObject.ParamFlags.READWRITE,
        '',
      ),
      id: GObject.ParamSpec.int(
        "id",
        '',
        '',
        GObject.ParamFlags.READWRITE,
        0, 10000000000, 0,
      ),
      month: GObject.ParamSpec.int(
        "month",
        '',
        '',
        GObject.ParamFlags.READWRITE,
        0, 12, 0,
      ),
      day_of_month: GObject.ParamSpec.int(
        "day_of_month",
        '',
        '',
        GObject.ParamFlags.READWRITE,
        0, 32, 0,
      ),
      year: GObject.ParamSpec.int(
        "year",
        '',
        '',
        GObject.ParamFlags.READWRITE,
        0, 50000, 0,
      ),
      day: GObject.ParamSpec.int(
        "day",
        '',
        '',
        GObject.ParamFlags.READWRITE,
        0, 400, 0,
      ),

    },
  },
  class History_list_object extends GObject.Object { },
);

export const History_list_model = GObject.registerClass(
  {
    Implements: [Gio.ListModel]
  },
  class History_list_model extends GObject.Object {
    constructor() {
      super();
      this.history_list = [];
    }

    vfunc_get_item_type() {
      return this.history_list;
    }

    vfunc_get_n_items() {
      return this.history_list.length;
    }

    vfunc_get_item(_pos) {
      return this.history_list[_pos];
    }

    _append_history_item(list) {
      const current_date = GLib.DateTime.new_now_local()

      list.forEach((item, index) => {
        const list_object = new History_list_object({
          title: item.title.toString(),
          subtitle: item.display_date.toString(),
          work_time: item.work_time,
          break_time: item.break_time,
          id: item.id,
          description: item.description.toString(),
          counts: item.sessions.toString(),
          month: item.month,
          day_of_month: item.day_of_month || 1,
          year: item.year || current_date.get_year(),
          day: item.day,
        });
        this.history_list.push(list_object);
      })
    }
  })

export function getFlatpakInfo() {
  const keyFile = new GLib.KeyFile();
  try {
    keyFile.load_from_file("/.flatpak-info", GLib.KeyFileFlags.NONE);
  } catch (err) {
    if (err.code !== GLib.FileError.NOENT) {
      logError(err);
    }
    return null;
  }
  return keyFile;
}
