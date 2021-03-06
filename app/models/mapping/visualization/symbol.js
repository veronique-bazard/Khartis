import Struct from 'khartis/models/struct';
import config from 'khartis/config/environment';
import SymbolBrewer from 'khartis/utils/symbolbrewer';
import ColorBrewer from 'khartis/utils/colorbrewer';

export const DEFAULT_FILL = "red";
export const DEFAULT_FILL_ALT = "rgb(62, 107, 158)";
export const DEFAULT_FILL_BEFORE_BREAK = "blue";
const DEFAULT_UNORDERED_SHAPES = ["circle", "rect", "line", "star", "times"];
const DEFAULT_STROKE_COLOR = "#404040";
const DEFAULT_STROKE = 0;
const DEFAULT_MAX_SIZE = 10;
const DEFAULT_COLOR_SET = "schemeAccent";

let SymbolVisualization = Struct.extend({
  
  type: "symbol",
  color: DEFAULT_FILL,
  colorBeforeBreak: DEFAULT_FILL_BEFORE_BREAK,
  shape: "circle",
  shapeSet: null,
  colorSet: DEFAULT_COLOR_SET,
  strokeColor: DEFAULT_STROKE_COLOR,
  stroke: DEFAULT_STROKE,
  maxSize: DEFAULT_MAX_SIZE,
  barWidth: 16,
  opacity: 1,

  mainType: function() {
    return this.get('type').split(".")[0];
  }.property('type'),

  absoluteMinSize: function() {
    return config.symbolMinMaxSize.proportional;
  }.property(),

  absoluteMaxSize: function() {
    return config.symbolMaxMaxSize.proportional;
  }.property(),

  availableShapes: DEFAULT_UNORDERED_SHAPES,

  resetToDefaults() {
    this.setProperties({
      stroke: DEFAULT_STROKE,
      maxSize: DEFAULT_MAX_SIZE
    });
  },

  recomputeAvailableShapes(ordered, classes, forceShapeSetUpdate=false) {
    if (!ordered) {
      this.set('availableShapes', DEFAULT_UNORDERED_SHAPES);
      this.set('shapeSet', null);
    } else {
      let shapes = SymbolBrewer.Composer.compose(this.get('shape'), classes);
      this.setProperties({
        'availableShapes': shapes,
        'shapeSet': (!this.get('shapeSet') || forceShapeSetUpdate) ? shapes[0] : this.get('shapeSet')
      });
    }
  },

  composeColorSet(length = 8, diverging = false, before = 0) {
    return ColorBrewer.Composer.compose(
      this.get('colorSet'),
      diverging,
      false,
      length,
      before,
      true
    );
  },
  
  colorStops(diverging) {
    if (diverging) {
      return [this.get('colorBeforeBreak'), this.get('color')];
    } else {
      return [this.get('color')];
    }
  },
  
  deferredChange: Ember.debouncedObserver(
    'type', 'color', 'colorSet',
    'strokeColor', 'stroke', 'colorBeforeBreak',
    'maxSize', 'shape', 'barWidth', 'opacity',
    function() {
      this.notifyDefferedChange();
    },
    10),
  
  export(props) {
    return this._super(Object.assign({
      type: this.get('type'),
      color: this.get('color'),
      shape: this.get('shape'),
      shapeSet: this.get('shapeSet'),
      colorSet: this.get('colorSet'),
      strokeColor: this.get('strokeColor'),
      stroke: this.get('stroke'),
      maxSize: this.get('maxSize'),
      colorBeforeBreak: this.get('colorBeforeBreak'),
      barWidth: this.get('barWidth'),
      opacity: this.get('opacity')
    }, props));
  }
  
});

SymbolVisualization.reopenClass({
  restore(json, refs = {}) {
    return this._super(json, refs, {
      type: json.type,
      color: json.color,
      shape: json.shape,
      shapeSet: json.shapeSet,
      colorSet: json.colorSet || DEFAULT_COLOR_SET,
      strokeColor: json.strokeColor,
      stroke: json.stroke,
      maxSize: json.maxSize,
      colorBeforeBreak: json.colorBeforeBreak,
      barWidth: json.barWidth,
      opacity: json.opacity
    });
  }
});

const SymbolVisualizationCategorical = SymbolVisualization.extend({
  type: "symbol.categorical",
  absoluteMinSize: function() {
    return config.symbolMinMaxSize.categorical;
  }.property(),
  absoluteMaxSize: function() {
    return config.symbolMaxMaxSize.categorical;
  }.property()
});

const SymbolVisualizationCombined = SymbolVisualization.extend({
  type: "symbol.combined",
  color: null,
  colorSet: null,
  colorStops(diverging) {
    if (diverging && this.get('colorSet')) {
      return this.composeColorSet(2, true, 1);
    } else if (this.get('color') != null) {
      return [this.get('color')];
    } else {
      return ["black"];
    }
  }
});

export default SymbolVisualization;
export {SymbolVisualizationCategorical, SymbolVisualizationCombined};
