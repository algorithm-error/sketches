// Barrel file: import "../ui/index.js" once to register every component in the
// kit, instead of listing each <script type="module" src="../ui/..."> by hand.
// Side-effect imports register the custom elements; named exports (where a
// module has one) are re-exported for callers that want the class directly.

import './custom-theme.js';

import './acknowledge-button.js';
export { AcknowledgeButton } from './acknowledge-button.js';

import './apply-button.js';
export { ApplyButton } from './apply-button.js';

import './binary-toggle.js';
export { BinaryToggle } from './binary-toggle.js';

import './color-swatches.js';

import './compound-range-slider.js';
export { CompoundRangeSlider } from './compound-range-slider.js';

import './compound-seed.js';
export { UICompoundSeed } from './compound-seed.js';

import './compound-slider.js';
export { UICompoundSlider } from './compound-slider.js';

import './control-column.js';
import './control-grid.js';
import './control-panel.js';
import './control-row.js';
import './custom-button.js';
import './custom-fieldset.js';

import './custom-grid.js';

import './vertical-split.js';
export { VerticalSplit } from './vertical-split.js';

import './custom-select.js';
export { UISelect } from './custom-select.js';

import './custom-range-slider.js';
export { CustomRangeSlider } from './custom-range-slider.js';

import './custom-slider.js';
export { CustomSlider } from './custom-slider.js';

import './angle-slider.js';
export { AngleSlider } from './angle-slider.js';

import './angle-pad.js';
export { AnglePad } from './angle-pad.js';

import './vector-pad.js';
export { VectorPad } from './vector-pad.js';

import './vector-slider.js';
export { VectorSlider } from './vector-slider.js';

import './compound-angle-slider.js';
export { CompoundAngleSlider } from './compound-angle-slider.js';

import './compound-angle-pad.js';
export { CompoundAnglePad } from './compound-angle-pad.js';

import './custom-toggle.js';
export { CustomToggle } from './custom-toggle.js';

import './help-text.js';
export { HelpText } from './help-text.js';

import './labeled-input.js';
export { LabeledInput } from './labeled-input.js';

import './labeled-numeric-input.js';
export { LabeledNumericInput } from './labeled-numeric-input.js';

import './labeled-radio.js';

import './labeled-radio-group.js';

import './labeled-select.js';
export { LabeledSelect } from './labeled-select.js';

import './numeric-input.js';
export { UINumberInput } from './numeric-input.js';

import './play-stop-button.js';
export { PlayStopButton } from './play-stop-button.js';

import './coordinate-input.js';
export { CoordinateInput } from './coordinate-input.js';

import './random-seed-button.js';
export { UIRandomSeedButton } from './random-seed-button.js';

import './size-input.js';
export { SizeInput } from './size-input.js';
