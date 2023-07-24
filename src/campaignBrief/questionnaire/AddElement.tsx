import { FormHelperText, Grid, IconButton, TextField } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import React, { FC, KeyboardEvent, useState } from 'react';

interface IAddElementProps {
  add: (text: string) => void;
  addLabel?: string;
  disabled?: boolean;
  disabledMessage?: string;
  validator?: (text: string) => string;
  maxLength?: number;
}

type Props = IAddElementProps;

const AddElement: FC<Props> = ({
  add,
  addLabel,
  disabledMessage,
  disabled = false,
  validator = null,
  maxLength = undefined,
}) => {
  const [textToAdd, setTextToAdd] = useState('');
  const [error, setError] = useState('');

  const disabledInput = textToAdd === '' || disabled;
  const addFn = () => {
    if (!disabledInput) {
      if (validator) {
        const possibleError = validator(textToAdd);

        if (possibleError.length > 0) {
          setError(possibleError);
          return;
        }
      }
      add(textToAdd);
      setTextToAdd('');
    }
  };

  return (
    <Grid container={true} spacing={1} justifyContent={'center'}>
      <Grid item={true} xs={true}>
        <TextField
          label={addLabel ? addLabel : 'Add'}
          fullWidth={true}
          multiline={true}
          value={textToAdd}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = event.target.value;
            if (validator) {
              const errorString = validator(newValue);
              setError(errorString);
            }

            // dont save value if it only contains whitespace or newlines
            if (newValue.length > 0 && newValue.replace(/^\s*/, '').replace(/\s*$/, '').length === 0) {
              return;
            }
            setTextToAdd(newValue);
          }}
          onKeyPress={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Enter' && error.length === 0 && !event.shiftKey) {
              addFn();
            }
          }}
        />
      </Grid>
      <IconButton disabled={disabledInput} color="primary" onClick={addFn}>
        <AddIcon />
      </IconButton>
      {maxLength && (
        <Grid item={true} xs={12}>
          <FormHelperText error={textToAdd.length > maxLength}>{`${textToAdd.length}/${maxLength}`}</FormHelperText>
        </Grid>
      )}
      <Grid item={true} xs={12}>
        {disabled && textToAdd !== '' && (
          <FormHelperText error={true}>
            {disabledMessage ? disabledMessage : 'You cannot add more elements of this kind'}
          </FormHelperText>
        )}
      </Grid>
      {error && error.length > 0 && (
        <Grid item={true} xs={12}>
          <FormHelperText error={true}>{error}</FormHelperText>
        </Grid>
      )}
    </Grid>
  );
};

export default AddElement;
