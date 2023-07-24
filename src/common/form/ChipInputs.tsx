import { Chip, Grid, InputAdornment, makeStyles } from '@material-ui/core';
import { ChipProps } from '@material-ui/core/Chip';
import PrimaryInterestSelectedIcon from '@material-ui/icons/Star';
import PrimaryInterestUnselectedIcon from '@material-ui/icons/StarBorder';
import React, { ChangeEvent, FC, useState } from 'react';

import { CommonTextInput, CommonTextInputProps } from './SimpleFormFields';

const useStyles = makeStyles({
  inputAdornmentRoot: {
    height: 'auto',
    maxHeight: 'none',
    maxWidth: '100%',
  },
  chip: {
    marginLeft: '10px',
  },
});

export enum ValidChipPrefixes {
  '#' = '#',
  '@' = '@',
}

type TextToChipsInputProps = {
  state: [string[], (newValue: string[]) => void];
  prefixCharacter: ValidChipPrefixes;
  deleteChip?: (indexOfChip: number) => void;
} & Omit<CommonTextInputProps, 'value' | 'onChange'>;

export const TextToChipsInput: FC<TextToChipsInputProps> = ({
  state,
  prefixCharacter,
  deleteChip,
  ...commonInputProps
}) => {
  const { disabled: loading } = commonInputProps;
  const { inputAdornmentRoot, chip } = useStyles();

  const [chipValues, setChipValues] = state;
  const [textValue, setTextValue] = useState('');

  const addChip = (chipValue: string) => {
    const firstCharacterIsAValidChipPrefix =
      chipValue.length > 0 ? Object.keys(ValidChipPrefixes).includes(chipValue.charAt(0)) : false;

    // Don't accept a chip that is just the mandatory prefix character
    const shouldAdd = (chipValue.length > 0 && !firstCharacterIsAValidChipPrefix) || chipValue.length > 1;

    if (shouldAdd) {
      if (firstCharacterIsAValidChipPrefix) {
        // Only add the value if it has not already been added
        !chipValues.includes(chipValue) && setChipValues([...chipValues, chipValue]);
      } else {
        const newChipValue = `${prefixCharacter}${chipValue}`;
        // Only add the value if it has not already been added
        !chipValues.includes(newChipValue) && setChipValues([...chipValues, newChipValue]);
      }

      // After commiting a chip value, start over
      setTextValue('');
    }
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;

    // Commit the chip value
    if (newValue.includes(' ')) {
      const newChipValues = newValue.split(' ');
      if (newChipValues && newChipValues.length > 0) {
        const newChipValue = newChipValues[0];
        addChip(newChipValue);
      }
    } else {
      // If we have not yet entered a space, pass the text value through
      setTextValue(newValue);
    }
  };

  const onDelete = deleteChip
    ? (index: number) => () => {
        if (!loading) {
          deleteChip(index);
        }
      }
    : undefined;

  const chipsView = (
    <InputAdornment position="start" classes={{ root: inputAdornmentRoot }}>
      {chipValues.map((value, index) => (
        <Chip label={value} className={chip} key={`${value}${index}`} onDelete={onDelete && onDelete(index)} />
      ))}
    </InputAdornment>
  );

  return (
    <Grid item={true} xs={12}>
      <CommonTextInput
        onChange={onChange}
        onBlur={() => addChip(textValue)}
        value={textValue}
        InputProps={{ startAdornment: chipsView }}
        {...commonInputProps}
      />
    </Grid>
  );
};

type ChipValue = { label: string; value: string };

type ChipsInputProps = {
  possibleValues: ChipValue[];
  state: [string[], (newValue: string[]) => void];
  secondaryState?: [string | undefined, (newValue: string) => void];
  disabled?: boolean;
} & Omit<ChipProps, 'color' | 'onClick' | 'label'>;

export const ChipsInput: FC<ChipsInputProps> = ({ state, secondaryState, possibleValues, disabled, ...chipsInput }) => {
  const [selectedValues, setSelectedValues] = state;
  const [secondaryVaue, setSecondaryValue] = secondaryState ? secondaryState : [undefined, undefined];

  return (
    <Grid container={true} spacing={1}>
      {possibleValues.map((currentValue, index) => {
        const valueIsSelected = selectedValues.includes(currentValue.value);
        const onChipClick = () => {
          if (valueIsSelected) {
            setSelectedValues(selectedValues.filter(selectedValue => selectedValue !== currentValue.value));
          } else {
            setSelectedValues([...selectedValues, currentValue.value]);
          }
        };

        return (
          <Grid item={true} key={`${possibleValues}${index}`}>
            <Chip
              onClick={disabled === true ? undefined : onChipClick}
              color={valueIsSelected ? 'primary' : 'default'}
              label={currentValue.label}
              onDelete={
                !setSecondaryValue || disabled === true ? undefined : () => setSecondaryValue(currentValue.value)
              }
              /* This icon is only displayed if onDelete is defined, so we don't have to
               * Explicitly make sure it is not shown if seoncdaryState is not passed along
               */
              deleteIcon={
                currentValue.value === secondaryVaue ? (
                  <PrimaryInterestSelectedIcon color="primary" />
                ) : (
                  <PrimaryInterestUnselectedIcon />
                )
              }
              {...chipsInput}
            />
          </Grid>
        );
      })}
    </Grid>
  );
};
