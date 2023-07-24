import { isDefined } from '@brandheroes/brandheroes-shared-project';
import {
  KeyboardDatePicker,
  KeyboardDatePickerProps,
  KeyboardTimePicker,
  KeyboardTimePickerProps,
} from '@material-ui/pickers';
import { DateTime } from 'luxon';
import React, { FC } from 'react';

const sharedProps: Pick<KeyboardDatePickerProps, 'clearable' | 'fullWidth' | 'autoOk'> = {
  fullWidth: true,
  autoOk: true,
  clearable: true,
};

type Props = {
  state: [DateTime | undefined | null, (newValue: DateTime | null) => void];
  error?: string;
};

type DateInputProps = Props & Omit<KeyboardDatePickerProps, 'onChange' | 'value' | 'error'>;

export const DateInput: FC<DateInputProps> = ({ state, error, ...customDateInputProps }) => {
  const [value, setValue] = state;

  const handleDateChange = (newValue: any) => {
    if (isDefined(newValue)) {
      const newDate = DateTime.fromISO(newValue.toString());

      const oldDateIsValid = !isDefined(value) || (DateTime.isDateTime(value) && value.isValid);
      const newDateIsValid = DateTime.isDateTime(newDate) && newDate.isValid;
      if (oldDateIsValid && newDateIsValid) {
        setValue(value ? value.set({ day: newDate.day, month: newDate.month, year: newDate.year }) : newDate);
      }
    } else {
      // In this case, newValue is either null or undefined. Either way, we want that to be passed on
      setValue(newValue);
    }
  };

  return (
    <KeyboardDatePicker
      value={value || null}
      onChange={handleDateChange}
      format="dd/MM/yyyy"
      animateYearScrolling={true}
      error={isDefined(error)}
      helperText={error}
      {...sharedProps}
      {...customDateInputProps}
    />
  );
};

type TimeInputProps = Props & Omit<KeyboardTimePickerProps, 'onChange' | 'value' | 'error'>;

export const TimeInput: FC<TimeInputProps> = ({ state, error, ...customTimeInputProps }) => {
  const [value, setValue] = state;

  const handleTimeChange = (newValue: any) => {
    if (isDefined(newValue)) {
      const newDate = DateTime.fromISO(newValue.toString());

      const oldDateIsValid = !isDefined(value) || (DateTime.isDateTime(value) && value.isValid);
      const newDateIsValid = DateTime.isDateTime(newDate) && newDate.isValid;
      if (oldDateIsValid && newDateIsValid) {
        setValue(value ? value.set({ hour: newDate.hour, minute: newDate.minute }) : newDate);
      }
    } else {
      // In this case, newValue is either null or undefined. Either way, we want that to be passed on
      setValue(newValue);
    }
  };

  return (
    <KeyboardTimePicker
      onChange={handleTimeChange}
      placeholder="Not required"
      value={value || null}
      format="HH:mm"
      ampm={false}
      error={isDefined(error)}
      helperText={error}
      {...sharedProps}
      {...customTimeInputProps}
    />
  );
};
