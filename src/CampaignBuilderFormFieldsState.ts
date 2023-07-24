import { ApolloError } from '@apollo/client';
import { isDefined } from '@brandheroes/brandheroes-shared-project';
import { isArray, isEmpty, isEqual } from 'lodash';
import { useCallback, useContext, useEffect, useState } from 'react';
import { BaseSchema } from 'yup';
import { ValidateOptions } from 'yup/lib/types';

import { useDebounce } from '../../hooks/debounce';
import { doValidation } from '../../hooks/validation';
import { logger } from '../../utils/Logger';
import { StepIndexContext } from './CampaignBuilder';
import { useCampaignFieldFeedback } from './CampaignBuilderFeedback';
import { CampaignBuilderValidationContext } from './CampaignBuilderValidation';

export function useCampaignFieldState<T, Q = T>(
  state: [T, (newValue: T) => void],
  validator: BaseSchema<Q | null | undefined> | null,
  mutationName: string,
  debounceValue: number | undefined = 750,
  validationOptions?: ValidateOptions,
  excludeField: boolean | undefined = false,
) {
  const validationDispatch = useContext(CampaignBuilderValidationContext);
  const stepIndex = useContext(StepIndexContext);

  const [value, setValue] = state;
  const [valueForMutation, setValueForMutation] = useState<T | undefined>();

  const [isTouched, setIsTouched] = useState(false);
  const [isPristine, setIsPristine] = useState(true);
  const [displayedError, setDisplayedError] = useState<string | undefined>();
  const [didPassValidation, setPassedValidation] = useState<boolean | undefined>();

  useEffect(() => {
    const valueIsPristineAfterChanges = !isDefined(value) || (isArray(value) && isEmpty(value));
    // A field can never become pristine again if it has lost that status - that can only happen on re-render
    setIsPristine(wasPristine => wasPristine && valueIsPristineAfterChanges);
  }, [value]);

  // Only allow the value to be passed on, if it is not the initial value and did pass validation
  const validatedValueWithDebounce = useDebounce(isTouched && didPassValidation ? value : undefined, debounceValue);
  const setValueWithStateUpdates = useCallback(
    (newValue: T) => {
      setIsTouched(true);

      setValue(newValue);
    },
    [setValue],
  ) as React.Dispatch<React.SetStateAction<T>>;

  const { registerMutation, deregisterMutation } = useCampaignFieldFeedback(mutationName);

  const reportFieldValidationStatus = useCallback(() => {
    validationDispatch && isDefined(didPassValidation)
      ? validationDispatch({
          type: 'updateFieldValidity',
          isValid: didPassValidation,
          mutationName: mutationName,
          belongsToStepWithIndex: stepIndex,
        })
      : !isDefined(validationDispatch) &&
        logger.warn(
          'Propogation of validation information failed due to missing validation context. Please ensure that you use the "useFieldState" hook in a componenet that is wrapped in the CampaignBuilderValidationContext',
        );
  }, [didPassValidation, mutationName, stepIndex, validationDispatch]);

  useEffect(() => {
    if (validator) {
      const { passedValidation, displayedError } = doValidation(value, validator, isPristine, validationOptions);

      setDisplayedError(displayedError);
      setPassedValidation(passedValidation);
    } else {
      // If we opt out of validation all together, we always pass validation
      setPassedValidation(true);
    }
  }, [isPristine, validationOptions, validator, value]);

  useEffect(() => {
    reportFieldValidationStatus();
  }, [reportFieldValidationStatus]);

  useEffect(() => {
    if (excludeField) {
      validationDispatch && validationDispatch({ type: 'removeFieldValidationStatus', mutationName });
    } else {
      if (validationDispatch && isDefined(didPassValidation)) {
        validationDispatch({
          type: 'updateFieldValidity',
          mutationName,
          isValid: didPassValidation,
          belongsToStepWithIndex: stepIndex,
        });
      }
    }
  }, [validationDispatch, excludeField, didPassValidation, mutationName, stepIndex]);

  useEffect(() => {
    // Null is used to communicate the deletion of an attribute (e.g primary interest)
    if (validatedValueWithDebounce !== undefined) {
      /* We need this check to ensure that we do not update reference values such as objects, date objects
       * and arrays whose reference changes but the semantic content of those values do not change */
      setValueForMutation(previousValue => {
        if (!isEqual(previousValue, validatedValueWithDebounce)) {
          registerMutation();
          return validatedValueWithDebounce;
        } else {
          return previousValue;
        }
      });
    } else {
      setValueForMutation(undefined);
    }
  }, [registerMutation, validatedValueWithDebounce]);

  return {
    valueForMutation,
    setValueWithStateUpdates,
    validationError: displayedError,
    deregisterMutation,
  };
}

export function useCampaignFieldInitialization<T>(
  initialValue: T | null | undefined,
  updateState: (newValue: T | undefined) => void,
  loading: boolean,
  error: ApolloError | undefined,
): [boolean, (newValue: boolean) => void] {
  const [hasBeenInitialized, setHasBeenInitialized] = useState(false);

  useEffect(() => {
    if (!hasBeenInitialized && !loading && !isDefined(error)) {
      updateState(initialValue || undefined);
      setHasBeenInitialized(true);
    }
  }, [error, hasBeenInitialized, initialValue, loading, updateState]);

  return [hasBeenInitialized, setHasBeenInitialized];
}
