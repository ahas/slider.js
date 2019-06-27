(function () {
    // 제이쿼리가 있을 때 플러그인으로 등록
    if (window.jQuery) {
        var slider = null;
        $.fn.slider = function (param) {
            if ($.isPlainObject(param) || !param) {
                slider = new Slider(this.get(0), param);
            } else {
                slider[param].apply(slider, Array.from(arguments).slice(1));
            }
            return this;
        };
    }
    // 애니메이션 요청관련 함수가 없을 때 대체 함수 구현
    var vendors = ['webkit', 'moz'];
    var last_time = 0;
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback, element) {
            var current_time = new Date().getTime();
            var time_to_call = Math.max(0, 16 - (current_time - last_time));
            var id = window.setTimeout(function () {
                callback(current_time + time_to_call);
            }, time_to_call);
            last_time = current_time + time_to_call;
            return id;
        };

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }
})();

function Slider(param, config) {
    config = config || {};
    this.element = typeof param == 'string' ? document.querySelector(param) : param;
    this.page_count = this.element.children.length;
    this.page_index = config.index || 0;
    this.page_old_index = this.page_index;
    this.page_offset = config.offset || 0;
    this.sensivility = config.sensivility || 100;
    this.interval = config.interval || 3000;
    this.duration = config.duration || 1000;
    this.auto = config.auto || true;
    this.tick = null;
    this.easing = Slider.EasingFunctions[config.easing || 'easeInOutSine'];
    this.mouse = {
        x: 0,
        y: 0,
        dx: 0,
        dy: 0,
        sx: 0,
        sy: 0,
        lx: 0,
        ly: 0,
        old_x: 0,
        old_y: 0,
        is_down: false
    };
    this.onPaged = config.onPaged || null;
    this.resize();
    this.init();
}

Slider.prototype.init = function () {
    var slider = this;
    var drag_delay = null;
    this.element.onmousedown = function (e) {
        slider.mouse.is_down = true;
        slider.mouse.dx = slider.mouse.dy = slider.mouse.lx = slider.mouse.ly = 0;
        slider.mouse.sx = slider.mouse.x = slider.mouse.old_x = e.clientX;
        slider.mouse.sy = slider.mouse.y = slider.mouse.old_y = e.clientY;
        slider.stop();
    };
    this.element.onmousemove = function (e) {
        if (slider.mouse.is_down) {
            slider.mouse.x = e.clientX;
            slider.mouse.y = e.clientY;
            slider.mouse.dx = slider.mouse.x - slider.mouse.old_x;
            slider.mouse.dy = slider.mouse.y - slider.mouse.old_y;
            slider.mouse.lx = slider.mouse.sx - slider.mouse.x;
            slider.mouse.ly = slider.mouse.sy - slider.mouse.y;
            slider.mouse.old_x = e.clientX;
            slider.mouse.old_y = e.clientY;
            slider.drag(slider.mouse.dx);
        }
    };
    this.element.onmouseup = function (e) {
        slider.mouse.is_down = false;
        if (Math.abs(slider.mouse.lx) < slider.page_width * 0.5 && Math.abs(slider.mouse.dx * slider.mouse.lx) > slider.sensivility) {
            slider.page_index += slider.mouse.dx < 0 ? 1 : -1;
        }
        slider.slide(slider.page_index);
        if (drag_delay) {
            clearTimeout(drag_delay);
        }
        drag_delay = setTimeout(function () {
            slider.start();
        }, slider.duration + slider.interval);
    };
    // 터치 이벤트 구현
    this.element.ontouchstart = function (e) {
        slider.element.onmousedown(e.touches[0]);
    };
    this.element.ontouchmove = function (e) {
        slider.element.onmousemove(e.touches[0]);
    };
    this.element.ontouchend = function (e) {
        slider.element.onmouseup(e.touches[0]);
    };
    this.element.onresize = function () {
        slider.resize();
    };
    window.addEventListener('resize', function (e) {
        slider.resize();
    });
    this.start();
    if (this.onPaged) {
        this.onPaged(this.page_index);
    }
}

Slider.prototype.next = function () {
    this.slide(this.page_index + 1);
    return this;
};

Slider.prototype.previous = function () {
    this.slide(this.page_index - 1);
    return this;
};

Slider.prototype.slide = function (page_index) {
    var slider = this;
    this.page_index = page_index;
    var start_time = new Date();
    // 애니메이션 대체 구현
    (function () {
        var start_offset = slider.page_offset;
        var change_offset = slider.page_width * slider.page_index - start_offset;
        var duration = slider.duration;
        function update() {
            var time = new Date() - start_time;
            if (time < duration) {
                slider.page_offset = slider.easing(time, start_offset, change_offset, duration);
                slider.anim_request_id = requestAnimationFrame(update);
            } else {
                time = duration;
                slider.page_offset = slider.easing(time, start_offset, change_offset, duration);
            }
            slider.refresh();
        }
        update();
    })();
    return this;
};

Slider.prototype.refresh = function () {
    this.page_index = Math.floor((this.page_offset + this.page_width * 0.5) / this.page_width);
    if (this.page_index != this.page_old_index) {
        if (this.page_index >= this.page_count) {
            this.page_index = 0;
            this.page_offset -= this.page_length;
        } else if (this.page_index < 0) {
            this.page_index = this.page_count - 1;
            this.page_offset += this.page_length;
        }
        this.page_old_index = this.page_index;
        if (this.onPaged) {
            this.onPaged(this.page_index);
        }
    }
    for (var i = 0; i < this.element.children.length; i++) {
        var child = this.element.children[i];
        var x = this.page_width * i - this.page_offset;
        if (x <= -child.clientWidth) {
            x += this.page_length;
        } else if (x >= this.page_width) {
            x -= this.page_length;
        }            
        child.style.transform = 'translateX(' + x + 'px)';
    }
    return this;
};

Slider.prototype.resize = function () {
    this.page_width = this.element.clientWidth;
    this.page_length = this.page_count * this.page_width;
    this.page_offset = this.page_index * this.page_width;
    this.refresh();
    this.stop();
    this.start();
    return this;
}

Slider.prototype.drag = function (offset) {
    this.page_offset -= offset;
    this.refresh();
    return this;
}

Slider.prototype.start = function () {
    var slider = this;
    this.stop();
    if (this.auto) {
        this.tick = setInterval(function () {
            slider.next();
        }, this.interval + this.duration);
    }
    return this;
};

Slider.prototype.stop = function () {
    if (this.anim_request_id) {
        cancelAnimationFrame(this.anim_request_id);
    }
    if (this.tick) {
        clearInterval(this.tick);
        this.tick = null;
    }
};

// Easing 관련 함수
Slider.EasingFunctions = {
    linear: function(t, b, c, d) {
        return c * t / d + b;
    },
    easeInQuad: function(t, b, c, d) {
        return c * (t /= d) * t + b;
    },
    easeOutQuad: function(t, b, c, d) {
        return -c * (t /= d) * (t - 2) + b;
    },
    easeInOutQuad: function(t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t + b;
        return -c / 2 * ((--t) * (t - 2) - 1) + b;
    },
    easeInCubic: function(t, b, c, d) {
        return c * (t /= d) * t * t + b;
    },
    easeOutCubic: function(t, b, c, d) {
        return c * ((t = t / d - 1) * t * t + 1) + b;
    },
    easeInOutCubic: function(t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
        return c / 2 * ((t -= 2) * t * t + 2) + b;
    },
    easeInQuart: function(t, b, c, d) {
        return c * (t /= d) * t * t * t + b;
    },
    easeOutQuart: function(t, b, c, d) {
        return -c * ((t = t / d - 1) * t * t * t - 1) + b;
    },
    easeInOutQuart: function(t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
        return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
    },
    easeInQuint: function(t, b, c, d) {
        return c * (t /= d) * t * t * t * t + b;
    },
    easeOutQuint: function(t, b, c, d) {
        return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
    },
    easeInOutQuint: function(t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
        return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
    },
    easeInSine: function(t, b, c, d) {
        return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
    },
    easeOutSine: function(t, b, c, d) {
        return c * Math.sin(t / d * (Math.PI / 2)) + b;
    },
    easeInOutSine: function(t, b, c, d) {
        return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
    },
    easeInExpo: function(t, b, c, d) {
        return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
    },
    easeOutExpo: function(t, b, c, d) {
        return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
    },
    easeInOutExpo: function(t, b, c, d) {
        if (t == 0) return b;
        if (t == d) return b + c;
        if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
        return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
    },
    easeInCirc: function(t, b, c, d) {
        return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
    },
    easeOutCirc: function(t, b, c, d) {
        return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
    },
    easeInOutCirc: function(t, b, c, d) {
        if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
        return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
    },
    easeInElastic: function(t, b, c, d, a, p) {
        a = a || 1.2;
        p = p || .3;
        if (t == 0) return b;
        if ((t /= d) == 1) return b + c;
        if (!p) p = d * .3;
        if (a < Math.abs(c)) {
            a = c;
            var s = p / 4;
        } else var s = p / (2 * Math.PI) * Math.asin(c / a);
        return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
    },
    easeOutElastic: function(t, b, c, d, a, p) {
        a = a || 1.2;
        p = p || .3;
        if (t == 0) return b;
        if ((t /= d) == 1) return b + c;
        if (!p) p = d * .3;
        if (a < Math.abs(c)) {
            a = c;
            var s = p / 4;
        } else var s = p / (2 * Math.PI) * Math.asin(c / a);
        return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
    },
    easeInOutElastic: function(t, b, c, d, a, p) {
        a = a || 1.2;
        p = p || .3;
        if (t == 0) return b;
        if ((t /= d / 2) == 2) return b + c;
        if (!p) p = d * (.3 * 1.5);
        if (a < Math.abs(c)) {
            a = c;
            var s = p / 4;
        } else var s = p / (2 * Math.PI) * Math.asin(c / a);
        if (t < 1) return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
        return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
    },
    easeInBack: function(t, b, c, d, s) {
        if (s == undefined) s = 1.70158;
        return c * (t /= d) * t * ((s + 1) * t - s) + b;
    },
    easeOutBack: function(t, b, c, d, s) {
        if (s == undefined) s = 1.70158;
        return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
    },
    easeInOutBack: function(t, b, c, d, s) {
        if (s == undefined) s = 1.70158;
        if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
        return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
    },
    easeInBounce: function(t, b, c, d) {
        return c - Slider.EasingFunctions.easeOutBounce(d - t, 0, c, d) + b;
    },
    easeOutBounce: function(t, b, c, d) {
        if ((t /= d) < (1 / 2.75)) {
            return c * (7.5625 * t * t) + b;
        } else if (t < (2 / 2.75)) {
            return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
        } else if (t < (2.5 / 2.75)) {
            return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
        } else {
            return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
        }
    },
    easeInOutBounce: function(t, b, c, d) {
        if (t < d / 2) return Slider.EasingFunctions.easeInBounce(t * 2, 0, c, d) * .5 + b;
        return Slider.EasingFunctions.easeOutBounce(t * 2 - d, 0, c, d) * .5 + c * .5 + b;
    }
};