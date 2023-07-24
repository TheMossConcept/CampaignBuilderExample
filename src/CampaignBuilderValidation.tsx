import { Tooltip, Typography } from '@material-ui/core';
import { SvgIconProps } from '@material-ui/core/SvgIcon';
import HelpIcon from '@material-ui/icons/Help';
import React, { Dispatch, FC, useReducer } from 'react';

type ValidationState = {
  validityOfFields: { [key: string]: { isValid: boolean; belongsToStepWithIndex: number | null } };
};

type ValidationActions =
  | {
      type: 'updateFieldValidity';
      mutationName: string;
      isValid: boolean;
      belongsToStepWithIndex: number | null;
    }
  | { type: 'removeFieldValidationStatus'; mutationName: string };

const validationReducer = (state: ValidationState, action: ValidationActions) => {
  switch (action.type) {
    case 'updateFieldValidity':
      return {
        ...state,
        validityOfFields: {
          ...state.validityOfFields,
          [action.mutationName]: { isValid: action.isValid, belongsToStepWithIndex: action.belongsToStepWithIndex },
        },
      };
    // For conditionally rendered fields. If a field is removed from the form, it should no longer count in the validation
    case 'removeFieldValidationStatus':
      return {
        ...state,
        validityOfFields: Object.keys(state.validityOfFields).reduce((accumulator, currentKey) => {
          if (currentKey !== action.mutationName) {
            return { ...accumulator, [currentKey]: state.validityOfFields[currentKey] };
          } else {
            return accumulator;
          }
        }, {}),
      };
    default:
      const a: never = action;
      return a;
  }
};

type Props = {
  validationState: ValidationState;
  forStep: number;
} & SvgIconProps;

export const ValidationHelp: FC<Props> = ({
  validationState,
  forStep,
  color = 'primary',
  fontSize = 'small',
  ...svgIconProps
}) => {
  const fieldValidityKeys = Object.keys(validationState.validityOfFields);
  const invalidFieldNames = fieldValidityKeys.filter(fieldValidityKey => {
    const validationValueForKey = validationState.validityOfFields[fieldValidityKey];
    return !validationValueForKey.isValid && validationValueForKey.belongsToStepWithIndex === forStep;
  });

  const tooltipTitle = (
    <>
      <Typography color="inherit">The following fields require your attention</Typography>
      {invalidFieldNames.map(invalidFieldName => (
        <Typography color="inherit" key={invalidFieldName}>
          {invalidFieldName}
        </Typography>
      ))}
    </>
  );

  return (
    <Tooltip title={tooltipTitle}>
      <div>
        <HelpIcon color={color} fontSize={fontSize} {...svgIconProps} />
      </div>
    </Tooltip>
  );
};

export const useCampaignBuilderValidationReducer = () => {
  return useReducer(validationReducer, { validityOfFields: {} });
};

export const CampaignBuilderValidationContext = React.createContext<Dispatch<ValidationActions> | null>(null);
