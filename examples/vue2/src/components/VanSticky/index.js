/* eslint-disable */
import Vue from 'vue';

let uid = 0;

function isHidden(el) {
  const style = window.getComputedStyle(el)
  const hidden = style.display === 'none'

  // offsetParent returns null in the following situations:
  // 1. The element or its parent element has the display property set to none.
  // 2. The element has the position property set to fixed
  const parentHidden = el.offsetParent === null && style.position !== 'fixed'

  return hidden || parentHidden
}

function convertRem(value) {
  value = value.replace(/rem/g, '')
  return +value * getRootFontSize()
}

function convertVw(value) {
  value = value.replace(/vw/g, '')
  return (+value * window.innerWidth) / 100
}

function convertVh(value) {
  value = value.replace(/vh/g, '')
  return (+value * window.innerHeight) / 100
}

export function unitToPx(value) {
  if (typeof value === 'number') {
    return value
  }

  if (inBrowser) {
    if (value.indexOf('rem') !== -1) {
      return convertRem(value)
    }
    if (value.indexOf('vw') !== -1) {
      return convertVw(value)
    }
    if (value.indexOf('vh') !== -1) {
      return convertVh(value)
    }
  }

  return parseFloat(value)
}

function transformFunctionComponent(pure) {
  return {
    functional: true,
    props: pure.props,
    model: pure.model,
    render: (h, context) =>
      pure(h, context.props, unifySlots(context), context),
  }
}

export function isFunction(val) {
  return typeof val === 'function';
}

export const SlotsMixin = {
  methods: {
    slots(name = 'default', props) {
      const { $slots, $scopedSlots } = this;
      const scopedSlot = $scopedSlots[name];

      if (scopedSlot) {
        return scopedSlot(props);
      }

      return $slots[name];
    },
  },
};

function install(that, Vue) {
  const { name } = that;
  Vue.component(name, that);
  Vue.component(camelize(`-${name}`), that);
}

export function createComponent2(name) {
  return function (sfc) {
    if (isFunction(sfc)) {
      sfc = transformFunctionComponent(sfc)
    }

    if (!sfc.functional) {
      sfc.mixins = sfc.mixins || []
      sfc.mixins.push(SlotsMixin)
    }

    sfc.name = name
    sfc.install = install

    return sfc
  }
}

function gen(name, mods) {
  if (!mods) {
    return '';
  }

  if (typeof mods === 'string') {
    return ` ${name}--${mods}`;
  }

  if (Array.isArray(mods)) {
    return mods.reduce((ret, item) => ret + gen(name, item), '');
  }

  return Object.keys(mods).reduce(
    (ret, key) => ret + (mods[key] ? gen(name, key) : ''),
    ''
  );
}

export function createBEM(name) {
  return function (el, mods) {
    if (el && typeof el !== 'string') {
      mods = el;
      el = '';
    }

    el = el ? `${name}__${el}` : name;

    return `${el}${gen(el, mods)}`;
  };
}

function createNamespace(name) {
  name = 'van-' + name
  return [createComponent2(name), createBEM(name)]
}

function isDef(val) {
  return val !== undefined && val !== null;
}

export const isServer = Vue.prototype.$isServer;

function isWindow(val){
  return val === window;
}


export function getScrollTop(el) {
  const top = 'scrollTop' in el ? el.scrollTop : el.pageYOffset;

  // iOS scroll bounce cause minus scrollTop
  return Math.max(top, 0);
}

export function getRootScrollTop() {
  return (
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  );
}

export function getElementTop(el, scroller) {
  if (isWindow(el)) {
    return 0;
  }

  const scrollTop = scroller ? getScrollTop(scroller) : getRootScrollTop();
  return el.getBoundingClientRect().top + scrollTop;
}

const overflowScrollReg = /scroll|auto/i;

export function getScroller(el, root = window) {
  let node = el;

  while (
    node &&
    node.tagName !== 'HTML' &&
    node.tagName !== 'BODY' &&
    node.nodeType === 1 &&
    node !== root
  ) {
    const { overflowY } = window.getComputedStyle(node);
    if (overflowScrollReg.test(overflowY)) {
      return node;
    }
    node = node.parentNode;
  }

  return root;
}

export let supportsPassive = false;

if (!isServer) {
  try {
    const opts = {};
    Object.defineProperty(opts, 'passive', {
      // eslint-disable-next-line getter-return
      get() {
        /* istanbul ignore next */
        supportsPassive = true;
      },
    });
    window.addEventListener('test-passive', null, opts);
    // eslint-disable-next-line no-empty
  } catch (e) {}
}

export function on(
  target,
  event,
  handler,
  passive 
) {
  console.warn('target666',target);
  console.warn('event666',event);
  console.warn('handler666',handler);
  console.warn('isServer666',isServer);
  if (!isServer) {
    window.addEventListener(
      event,
      handler,
      // 是这段代码的问题，如果capture改为true，则可以吸顶，感觉和事件捕获有关
      supportsPassive ? { capture: false, passive } : false
    );
  }
}

export function off(target, event, handler) {
  if (!isServer) {
    target.removeEventListener(event, handler);
  }
}

export function BindEventMixin(handler) {
  const key = `binded_${uid++}`;

  console.log('handler',handler);

  function bind() {
    if (!this[key]) {
      handler.call(this, on, true);
      this[key] = true;
    }
  }

  function unbind() {
    if (this[key]) {
      handler.call(this, off, false);
      this[key] = false;
    }
  }

  return {
    mounted: bind,
    activated: bind,
    deactivated: unbind,
    beforeDestroy: unbind,
  };
}


const [createComponent, bem] = createNamespace('sticky')

const myMixins = BindEventMixin(function (bind, isBind) {
  console.log('this.$el',this.$el);
  if (!this.scroller) {
    this.scroller = getScroller(this.$el)
  }

  console.log('this.scroller',this.scroller);

  // if (this.observer) {
  //   const method = isBind ? 'observe' : 'unobserve'
  //   this.observer[method](this.$el)
  // }

  bind(this.scroller, 'scroll', this.onScroll, true)
  this.onScroll()
})

console.warn('myMixins',myMixins)

export default createComponent({
  mixins: [
    myMixins
  ],

  props: {
    zIndex: [Number, String],
    container: null,
    offsetTop: {
      type: [Number, String],
      default: 0,
    },
  },

  data() {
    return {
      fixed: false,
      height: 0,
      transform: 0,
    }
  },

  computed: {
    offsetTopPx() {
      return unitToPx(this.offsetTop)
    },

    style() {
      if (!this.fixed) {
        return
      }

      const style = {}

      if (isDef(this.zIndex)) {
        style.zIndex = this.zIndex
      }

      if (this.offsetTopPx && this.fixed) {
        style.top = `${this.offsetTopPx}px`
      }

      if (this.transform) {
        style.transform = `translate3d(0, ${this.transform}px, 0)`
      }

      return style
    },
  },

  watch: {
    fixed(isFixed) {
      this.$emit('change', isFixed)
    },
  },

  created() {
    // compatibility: https://caniuse.com/#feat=intersectionobserver
    console.log('window.IntersectionObserver112323',window.IntersectionObserver);
    if (!isServer && window.IntersectionObserver) {
      this.observer = new IntersectionObserver(
        (entries) => {
          // trigger scroll when visibility changed
          if (entries[0].intersectionRatio > 0) {
            this.onScroll()
          }
        },
        { root: document.body }
      )
    }
  },

  methods: {
    onScroll() {
      console.error('onScroll...', this.$el)
      // console.log('onScroll...', this.$el)
      if (isHidden(this.$el)) {
        return
      }

      this.height = this.$el.offsetHeight

      const { container, offsetTopPx } = this
      const scrollTop = getScrollTop(window)
      const topToPageTop = getElementTop(this.$el)

      // console.log('scrollTop',scrollTop);
      // console.log('topToPageTop',topToPageTop);

      const emitScrollEvent = () => {
        this.$emit('scroll', {
          scrollTop,
          isFixed: this.fixed,
        })
      }

      // The sticky component should be kept inside the container element
      if (container) {
        const bottomToPageTop = topToPageTop + container.offsetHeight

        if (scrollTop + offsetTopPx + this.height > bottomToPageTop) {
          const distanceToBottom = this.height + scrollTop - bottomToPageTop

          if (distanceToBottom < this.height) {
            this.fixed = true
            this.transform = -(distanceToBottom + offsetTopPx)
          } else {
            this.fixed = false
          }

          emitScrollEvent()
          return
        }
      }

      if (scrollTop + offsetTopPx > topToPageTop) {
        this.fixed = true
        this.transform = 0
      } else {
        this.fixed = false
      }

      emitScrollEvent()
    },
  },

  render() {
    const { fixed } = this
    const style = {
      height: fixed ? `${this.height}px` : null,
    }

    return (
      <div style={style}>
        <div class={bem({ fixed })} style={this.style}>
          {this.slots()}
        </div>
      </div>
    )
  },
})
