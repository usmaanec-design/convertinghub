import { tool as numberRandomPortGenerator } from './random-port-generator/meta';
import { tool as numberGenerate } from './generate/meta';
import { tool as numberArithmeticSequence } from './arithmetic-sequence/meta';
import { tool as numberByteConverter } from './byte-converter/meta';
import { tool as numberNumberToWords } from './number-to-words/meta';
import { tools as genericCalcTools } from './generic-calc/meta';

export const numberTools = [
  numberGenerate,
  numberArithmeticSequence,
  numberRandomPortGenerator,
  numberByteConverter,
  numberNumberToWords,
  ...genericCalcTools
];
