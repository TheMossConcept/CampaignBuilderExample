import { isDefined } from '@brandheroes/brandheroes-shared-project';
import { FormHelperText, Grid, IconButton, Typography } from '@material-ui/core';
import AddIcon from '@material-ui/icons/AddCircle';
import DeleteIcon from '@material-ui/icons/Delete';
import SaveIcon from '@material-ui/icons/Save';
import { uniqueId } from 'lodash';
import React, { FC, useEffect, useReducer } from 'react';
import { ArraySchema, ObjectSchema, StringSchema } from 'yup';
import { Assign, ObjectShape } from 'yup/lib/object';
import { AnyObject } from 'yup/lib/types';

import { doValidation } from '../../../hooks/validation';
import Loading from '../Loading';
import { TextInput } from './SimpleFormFields';

type LabelValue = {
  label: string;
  value: string;
};

type LabelValueInputProps = {
  state: [LabelValue[] | undefined, (newValue: LabelValue[]) => void];
  title?: string;
  loading?: boolean;
  labelMax?: number;
  valueMax?: number;
  validator?: ArraySchema<
    ObjectSchema<
      Assign<
        ObjectShape,
        {
          label: StringSchema<string | undefined, AnyObject, string | undefined>;
          value: StringSchema<string | undefined, AnyObject, string | undefined>;
        }
      >
    >
  >;
};

const LabelValueInput: FC<LabelValueInputProps> = ({ state, title, loading, labelMax, valueMax, validator }) => {
  const [initialValues, commitChanges] = state;

  const [customInputFields, customInputFieldsDispatch] = useReducer(reducer, undefined);

  // Initial value is only the very first value the useReducer hook receives, therefore, we cannot simply pass
  // initialCustomInputFieldsValues as the second argument to useReducer
  useEffect(() => {
    const initialCustomInputFieldsValues = initialValues
      ? initialValues.map(initialValue => ({
          label: initialValue.label,
          value: initialValue.value,
          localId: uniqueId(),
        }))
      : undefined;

    if (initialCustomInputFieldsValues) {
      customInputFieldsDispatch({ type: 'initialize', initialState: initialCustomInputFieldsValues });
    }
  }, [initialValues]);

  const commitChangesWrapper = () => {
    if (customInputFields) {
      const customInputFieldsWithoutLocalIds = customInputFields.map(customInputField => ({
        label: customInputField.label,
        value: customInputField.value,
      }));

      commitChanges(customInputFieldsWithoutLocalIds);
    }
  };

  const { passedValidation } = validator
    ? doValidation(customInputFields, validator, false)
    : { passedValidation: true };

  const disableSaveBtn = !isDefined(customInputFields) || !passedValidation;

  return (
    <Grid container={true} justifyContent="center" spacing={1}>
      <Grid item={true} xs={12}>
        <Grid container={true} justifyContent={title ? 'space-between' : 'flex-end'}>
          {title && (
            <Grid item={true}>
              <Typography variant="h6">{title}</Typography>
            </Grid>
          )}
          <Grid item={true}>
            <IconButton disabled={disableSaveBtn} onClick={commitChangesWrapper}>
              {loading ? <Loading variant="button" /> : <SaveIcon color={disableSaveBtn ? 'inherit' : 'primary'} />}
            </IconButton>
          </Grid>
        </Grid>
      </Grid>
      {customInputFields &&
        customInputFields.map(customInputField => {
          const labelLength = customInputField.label.length;
          const valueLength = customInputField.value.length;

          return (
            <Grid item={true} xs={12} key={customInputField.localId}>
              <Grid container={true} spacing={1}>
                <Grid item={true} xs={true}>
                  <TextInput
                    state={[
                      customInputField.label,
                      (newLabel: string) =>
                        customInputFieldsDispatch({
                          type: 'updateLabel',
                          localId: customInputField.localId,
                          label: newLabel,
                        }),
                    ]}
                    label="Label"
                    fullWidth={true}
                  />
                  {labelMax && (
                    <FormHelperText error={labelLength > labelMax}>
                      {labelLength}/{labelMax}
                    </FormHelperText>
                  )}
                </Grid>
                <Grid item={true} xs={true}>
                  <TextInput
                    state={[
                      customInputField.value,
                      (newValue: string) =>
                        customInputFieldsDispatch({
                          type: 'updateValue',
                          localId: customInputField.localId,
                          value: newValue,
                        }),
                    ]}
                    label="Value"
                    fullWidth={true}
                  />
                  {valueMax && (
                    <FormHelperText error={valueLength > valueMax}>
                      {valueLength}/{valueMax}
                    </FormHelperText>
                  )}
                </Grid>
                <Grid item={true}>
                  <IconButton
                    onClick={() =>
                      customInputFieldsDispatch({ type: 'deleteField', localId: customInputField.localId })
                    }
                  >
                    <DeleteIcon color="secondary" />
                  </IconButton>
                </Grid>
              </Grid>
            </Grid>
          );
        })}
      <Grid item={true}>
        <IconButton onClick={() => customInputFieldsDispatch({ type: 'addField' })}>
          <AddIcon color="primary" />
        </IconButton>
      </Grid>
    </Grid>
  );
};

export default LabelValueInput;

type CustomInputField = {
  localId: string;
  label: string;
  value: string;
};
type Action =
  // Not very redux like, but a nice escape hatch to have
  | { type: 'initialize'; initialState: CustomInputField[] }
  | { type: 'updateLabel'; localId: string; label: string }
  | { type: 'updateValue'; localId: string; value: string }
  | { type: 'deleteField'; localId: string }
  | { type: 'addField' };

const reducer = (state: CustomInputField[] | undefined, action: Action) => {
  switch (action.type) {
    case 'updateLabel':
      return state?.map(inputField => {
        if (inputField.localId === action.localId) {
          return { ...inputField, label: action.label };
        } else {
          return inputField;
        }
      });
    case 'updateValue':
      return state?.map(inputField => {
        if (inputField.localId === action.localId) {
          return { ...inputField, value: action.value };
        } else {
          return inputField;
        }
      });
    case 'deleteField':
      return state?.filter(inputField => inputField.localId !== action.localId);
    case 'addField':
      return [...(state || []), { label: '', value: '', localId: uniqueId() }];
    case 'initialize':
      const initialState = action.initialState;
      return initialState
        ? initialState.map(initialField => ({
            label: initialField.label,
            value: initialField.value,
            localId: uniqueId(),
          }))
        : undefined;
    default:
      let a: never = action;
      return a;
  }
};
