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

import Adw from 'gi://Adw';
import GLib from 'gi://GLib';
import { PomodoroItem } from './pomodoro-item.js';

/**
 *
 * Timer
 * @param {object} params
 * @param {Adw.Application} params.application
 * @param {PomodoroItem} params.pomodoro_item
 * @param {Settings} params.settings
 * @param {object} params.sound_player
 * @param {object} params.notification
 *
 * @typeref {object}
 * @property {Function} start
 * @property {Function} stop
 * @property {Function} reset
 * @property {Function} skip
 * @property {Function} connect
 * @property {object} data
 *
 */
export const timer = ({ application, pomodoro_item, settings, sound_player, notification  }) => {
  let timer_state = 'stopped';
  let work_time = settings.get_int('work-time-st') * 60;
  let break_time = settings.get_int('break-time-st') * 60;
  let current_time = work_time;
  let current_break_time = break_time;
  let long_break = settings.get_int('long-break-st') * 60;
  let sessions_long_break = settings.get_int('sessions-long-break');

  const events = {
    start: [],
    pause: [],
    stop: [],
    run: [],
    end: [],
  }

  settings.change('timer_customization', () => {
    if (timer_state === 'stopped') {
      work_time = settings.get_int('work-time-st') * 60;
      current_time = work_time;
      break_time = settings.get_int('break-time-st') * 60;
      long_break = settings.get_int('long-break-st') * 60;
      sessions_long_break = settings.get_int('sessions-long-break');
    }
  });

  /**
   *
   * Start timer
   *
   */
  const start = () => {
    if (timer_state === 'stopped') {
      work_time = settings.get_int('work-time-st') * 60;
      break_time = settings.get_int('break-time-st') * 60;
      current_time = work_time;
      current_break_time = break_time;
      long_break = settings.get_int('long-break-st') * 60;
      sessions_long_break = settings.get_int('sessions-long-break');
      timer_state = 'running';
      pomodoro_item.save();
      run();
      event('start');
    } else if (timer_state === 'paused') {
      event('start');
      timer_state = 'running';
    } else {
      event('pause');
      timer_state = 'paused';
    }
  }

  /**
   *
   * Reset timer method
   *
   */
  const reset = () => {
    current_time = work_time;
    current_break_time = break_time;
    timer_state = 'stopped';
    pomodoro_item.delete();
    event('stop');
  }

  /**
   *
   * Stop timer method
   *
   */
  const stop = () => {
    work_time = settings.get_int('work-time-st') * 60;
    break_time = settings.get_int('break-time-st') * 60;
    long_break = settings.get_int('long-break-st') * 60;
    sessions_long_break = settings.get_int('sessions-long-break');
    current_time = work_time;
    current_break_time = break_time;
    timer_state = 'stopped';
    pomodoro_item.update();
    pomodoro_item.default_item();
    event('stop');
  }

  /**
   *
   * SKip timer method
   *
   */
  const skip = () => {
    if(current_time > -1) {
      current_time = 1;
      timer_state = 'running';
    } else {
      current_time = work_time;
      current_break_time = break_time;
      finish_timer();
    }
  }


  /**
   *
   * Invokes timer events
   * @param {string} event
   * @param {Function} callback
   *
   */
  const connect = (event, callback) => {
    events[event].push(callback);
  }

  /**
   *
   * Event listener
   * @param {string} event
   *
   */
  const event = (event) => {
    for(const listener of events[event]) {
      listener({ data: get_timer_data(), pomodoro_item: pomodoro_item.get });
    }
  }

  /**
   *
   * Format timer method
   *
   */
  const format_time = () => {
    let hours = Math.floor(Math.abs(current_time < 0 ? current_time + current_break_time : current_time) / 60 / 60)
    let minutes = Math.floor(Math.abs(current_time < 0 ? current_time + current_break_time : current_time) / 60) % 60;
    let seconds = Math.abs(current_time < 0 ? current_time + current_break_time : current_time) % 60;

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

  /**
   *
   * Finish timer
   *
   */
  const finish_timer = () => {
    timer_state = 'paused';
    if(!application.get_active_window().visible)
      application.utils.background_status.set_status({ message: `${_('Paused')}` });

    current_time = work_time;
    current_break_time = break_time;
    pomodoro_item.set = {sessions: pomodoro_item.get.sessions + 1};
    event('end');
    if (pomodoro_item.get.sessions === sessions_long_break) {
      current_break_time = long_break;
      pomodoro_item.set = {sessions: 0};
    }
    if (settings.get_boolean('autostart')) {
      start();
    }
    pomodoro_item.update();
    notification.send({ title: `${_("Pomodoro finished")} - ${pomodoro_item.get.title}`, body: `${_("Description")}: ${pomodoro_item.get.description}\n${_("Created at")}: ${pomodoro_item.get.display_date}` });
    sound_player.play({sound_settings: 'timer-finish-sound'});
  }

  /**
   *
   * Run time
   *
   */
  const run = () => {
    GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
      if (timer_state === 'stopped') {
        return GLib.SOURCE_REMOVE
      }

      if (timer_state === 'paused') {
        if(!application.get_active_window().visible)
          application.utils.background_status.set_status({ message: `${_('Paused')}` });
        return GLib.SOURCE_CONTINUE
      }

      if (current_time === work_time) {
        notification.send({ title: `${_("Pomodoro started")} - ${pomodoro_item.get.title}`, body: `${_("Description")}: ${pomodoro_item.get.description}\n${_("Created at")}: ${pomodoro_item.get.display_date}` })
        sound_player.play({sound_settings: 'timer-start-sound'});
      } else if (current_time === 0) {
        if (!settings.get_boolean('autostart')) {
          timer_state = 'paused';
          if(!application.get_active_window().visible)
            application.utils.background_status.set_status({ message: `${_('Paused')}` });

          event('end');
        }
        notification.send({ title: `${_("Pomodoro break time")} - ${pomodoro_item.get.title}`, body: `${_("Description")}: ${pomodoro_item.get.description}\n${_("Created at")}: ${pomodoro_item.get.display_date}` })
        sound_player.play({ sound_settings: 'timer-break-sound'});
      }

      if (current_time > 0) {
        pomodoro_item.set = {work_time: pomodoro_item.get.work_time + 1};
      } else {
        pomodoro_item.set = {break_time: pomodoro_item.get.break_time + 1};
      }

      if(!application.get_active_window().visible)
        application.utils.background_status.set_status({ message: `${current_time > 0 ? _('Work time') :  _('Break time')}: ${format_time()}`});

      current_time--
      pomodoro_item.update();
      event('run');

      if (current_time > (current_break_time * -1)) {
        return GLib.SOURCE_CONTINUE
      }
      finish_timer();
      return GLib.SOURCE_CONTINUE
    })
  };

  /**
   *
   * Return timer data
   * @typedef {object}
   * @property {number} work_time
   * @property {number} break_time
   * @property {number} current_time
   * @property {string} formatted_time
   *
   */
  const get_timer_data = () => {
    return {
      timer_state,
      work_time,
      break_time,
      current_time,
      formatted_time: format_time(),
    }
  }

  return {
    start,
    stop,
    reset,
    skip,
    connect,
    get_data: get_timer_data,
  }
}
