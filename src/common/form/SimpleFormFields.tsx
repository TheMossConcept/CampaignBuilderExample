import { isDefined } from '@brandheroes/brandheroes-shared-project';
import {
  FormControlLabel,
  FormGroup,
  FormHelperText,
  MenuItem,
  Select,
  Switch,
  TextField,
  withStyles,
} from '@material-ui/core';
import Checkbox, { CheckboxProps } from '@material-ui/core/Checkbox';
import { FormControlLabelProps } from '@material-ui/core/FormControlLabel';
import Radio, { RadioProps } from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import { SelectProps } from '@material-ui/core/Select';
import { SwitchProps } from '@material-ui/core/Switch';
import { TextFieldProps } from '@material-ui/core/TextField';
import React, { ChangeEvent, FC, PropsWithChildren } from 'react';

import { theme } from '../../../MaterialTheme';
import { ValidateCurrencyAndDoPrecision } from '../../../utils/BudgetHelpers';

type TextInputProps = {
  state: [string | undefined, (newValue: string) => void];
} & Omit<CommonTextInputProps, 'value' | 'onChange'>;

export const TextInput: FC<TextInputProps> = ({ state, ...commonInputProps }) => {
  const [value, setValue] = state;

  return (
    <CommonTextInput
      // If the UI starts with undefined, the placeholder will be on the text
      value={value || ''}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setValue(newValue);
      }}
      {...commonInputProps}
    />
  );
};

type DecimalInputProps = {
  state: [string | undefined, (newValue: string) => void];
  precision?: number;
} & Omit<CommonTextInputProps, 'value' | 'onChange'>;

export const DecimalInput: FC<DecimalInputProps> = ({ state, precision = 2, ...commonInputProps }) => {
  const [value, setValue] = state;

  return (
    <CommonTextInput
      value={value || ''}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        const validatedResult = ValidateCurrencyAndDoPrecision(newValue, precision);
        if (isDefined(validatedResult)) {
          setValue(validatedResult);
        }
      }}
      {...commonInputProps}
    />
  );
};

type NumberInputProps = {
  state: [number | undefined, (newValue: number) => void];
} & Omit<CommonTextInputProps, 'value' | 'onChange' | 'type'>;

export const NumberInput: FC<NumberInputProps> = ({ state, ...commonInputProps }) => {
  const [value, setValue] = state;

  return (
    <CommonTextInput
      value={value ? value.toString() : ''}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        const rawNewValue = event.target.value;
        const newValue = parseInt(rawNewValue);

        if (isFinite(newValue)) {
          setValue(newValue);
        }
        if (rawNewValue === '') {
          setValue(0);
        }
      }}
      type="number"
      {...commonInputProps}
    />
  );
};

export type CommonTextInputProps = {
  error?: string;
} & Omit<TextFieldProps, 'error' | 'helperText'>;

export const CommonTextInput: FC<CommonTextInputProps> = ({ error, variant, children, ...textFieldProps }) => {
  return (
    <TextField
      multiline={true}
      error={isDefined(error)}
      helperText={error}
      /*
       * Variant workaround for this: https://stackoverflow.com/questions/55664421/how-do-i-pass-in-the-variant-property-of-the-material-ui-textfield-from-a-wrappi.
       * We know the type is right because it comes from TextFieldProps
       */
      variant={variant as any}
      children={children}
      {...textFieldProps}
    />
  );
};

type SwitchInputProps = {
  state: [boolean, (newValue: boolean) => void];
  error?: string;
} & Omit<SwitchProps, 'onChange, checked'> &
  Pick<FormControlLabelProps, 'label'>;

export const SwitchInput: FC<SwitchInputProps> = ({ state, label, error, ...switchProps }) => {
  const [checked, setChecked] = state;
  return (
    <FormGroup>
      <FormControlLabel
        control={<Switch checked={checked} onChange={(_, checked) => setChecked(checked)} {...switchProps} />}
        label={label}
      />
      {error && <FormHelperText error={true}>{error}</FormHelperText>}
    </FormGroup>
  );
};

type CheckboxInputProps = {
  state: [boolean, (newValue: boolean) => void];
  error?: string;
} & Omit<CheckboxProps, 'onChange, checked'> &
  Pick<FormControlLabelProps, 'label'>;

export const CheckboxInput: FC<CheckboxInputProps> = ({ state, label, error, ...checkboxProps }) => {
  const [checked, setChecked] = state;
  return (
    <>
      <FormControlLabel
        control={<Checkbox checked={checked} onChange={(_, checked) => setChecked(checked)} {...checkboxProps} />}
        label={label}
      />
      {error && <FormHelperText error={true}>{error}</FormHelperText>}
    </>
  );
};

type PossibleInputValues<T> = { label: string; value: T };

type RadioButtonsInputProps = {
  state: [string | undefined, (newValue: string | undefined) => void];
  possibleValues: (PossibleInputValues<string> | null)[];
  error?: string;
} & Omit<RadioProps, 'onChange, checked'>;

export const RadioButtonsInput: FC<RadioButtonsInputProps> = ({ state, possibleValues, error, ...radioProps }) => {
  const [value, setValue] = state;
  return (
    <>
      <RadioGroup onChange={(_, value) => setValue(value)} row={true}>
        {possibleValues.map((possibleValue, index) =>
          possibleValue ? (
            <FormControlLabel
              control={<Radio checked={possibleValue.value === value} {...radioProps} />}
              label={possibleValue.label}
              value={possibleValue.value}
              key={`${possibleValue.value}${index}`}
            />
          ) : null,
        )}
      </RadioGroup>
      {error && <FormHelperText error={true}>{error}</FormHelperText>}
    </>
  );
};

type SelectInputProps<T> = {
  state: [T | undefined, (newValue: T) => void];
  possibleValues: PossibleInputValues<T>[];
  error?: string;
} & Omit<SelectProps, 'value' | 'onChange' | 'children' | 'error'>;

export const SelectInput = <T extends string | number | string[] | undefined>({
  state,
  possibleValues,
  error,
  ...selectProps
}: PropsWithChildren<SelectInputProps<T>>): ReturnType<FC<SelectInputProps<T>>> => {
  const [value, setValue] = state;
  return (
    <>
      <Select
        // For a select, an empty string means no option selected
        value={value || ''}
        onChange={event => {
          // We know that event.target.value can only be T, as we only supply values that are of type T
          setValue((event.target.value as unknown) as T);
        }}
        {...selectProps}
      >
        {possibleValues.map((possibleValue, index) => (
          <MenuItem key={`${possibleValue}${index}`} value={possibleValue.value}>
            {possibleValue.label}
          </MenuItem>
        ))}
      </Select>
      {error && <FormHelperText error={true}>{error}</FormHelperText>}
    </>
  );
};

export const CssTextField = withStyles({
  root: {
    '& label.Mui-focused': {
      color: 'green',
    },
    '& .MuiInput-underline:after': {
      borderBottomColor: 'green',
    },
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: 'red',
      },
      '&:hover fieldset': {
        borderColor: theme.palette.primary.main,
      },
      '&.Mui-focused fieldset': {
        borderColor: 'green',
      },
    },
  },
})(TextField);
