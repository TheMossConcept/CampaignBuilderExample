/* global google */
import { Grid, List, ListItem, ListItemText, Paper, Popper } from '@material-ui/core';
import { InputBaseComponentProps } from '@material-ui/core/InputBase';
import { ListItemProps } from '@material-ui/core/ListItem';
import React, { FC, useEffect, useRef, useState } from 'react';
import PlacesAutocomplete from 'react-places-autocomplete';

import { logger } from '../../../utils/Logger';
import { GoogleMapsApiHOC, WithGoogleMapsApi } from '../google-maps-api/GoogleMapsApi';
import Loading, { LoadingVariant } from '../Loading';
import { CommonTextInput, CommonTextInputProps } from './SimpleFormFields';

type Props = {
  state: [string | undefined, (newValue: string) => void];
  debounce?: number;
} & WithGoogleMapsApi &
  Omit<CommonTextInputProps, 'inputRef' | 'label'>;

// https://github.com/hibiken/react-places-autocomplete#searchOptions
// At the moment, the backend requires street number for address objects, so we need to only accept addresses here
// General input types (bounds, location etc): https://developers.google.com/maps/documentation/javascript/reference/places-autocomplete-service#AutocompletionRequest
// Supported address type inputs: https://developers.google.com/places/supported_types#table3
// Type explanation: https://developers.google.com/maps/documentation/geocoding/intro#Types
// Test widget: https://developers.google.com/maps/documentation/javascript/examples/places-autocomplete

const LocationInput: FC<Props> = ({ state, getGeoCodeFromPlaceID, googleMaps, debounce = 750, ...inputProps }) => {
  const searchOptions = {
    location: new google.maps.LatLng(56.172684, 10.1879015),
    radius: 3000 * 1000, // 3000 km radius bias to include most of Europe
    types: ['geocode'],
  };

  const [textualAddress, setTextualAddress] = useState<string | undefined>();
  const [status, setStatus] = useState<google.maps.places.PlacesServiceStatus | undefined>();
  const [placeId, setPlaceId] = state;

  // Keep the textual address displayed to the user and the placeId saved in the datebase in sync
  useEffect(() => {
    const updateTextualAddress = async () => {
      if (getGeoCodeFromPlaceID && placeId) {
        const geoCodes = await getGeoCodeFromPlaceID(placeId);

        // We assume there is only one unique geocode for our placeId
        const geoCode = geoCodes.length > 0 ? geoCodes[0] : undefined;
        setTextualAddress(geoCode ? geoCode.formatted_address : undefined);
      } else {
        setTextualAddress('');
      }
    };

    updateTextualAddress();
  }, [getGeoCodeFromPlaceID, placeId]);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const onAddressSelected = (newTextualAddress: string, placeId: string) => {
    setTextualAddress(newTextualAddress);
    setPlaceId(placeId);
  };

  const onUserTyping = (newTextValue: string) => {
    setTextualAddress(newTextValue);
  };

  const onError = (status: string, clearSuggestion: () => void) => {
    logger.warn(`Error with status: ${status} occurred in CDraftLocationInput`);
    setStatus((status as unknown) as google.maps.places.PlacesServiceStatus);

    clearSuggestion();
  };

  return (
    <PlacesAutocomplete
      onChange={onUserTyping}
      onSelect={onAddressSelected}
      onError={onError}
      value={textualAddress || ''}
      searchOptions={searchOptions}
      debounce={debounce}
    >
      {({ getInputProps, getSuggestionItemProps, loading: autocompleteLoading, suggestions }) => {
        const { onBlur, ...autocompleteInputProps } = getInputProps({});
        return (
          <>
            <CommonTextInput
              placeholder="Search address"
              inputProps={
                {
                  ...autocompleteInputProps,
                } as InputBaseComponentProps
              }
              inputRef={inputRef}
              {...inputProps}
            />
            <Popper
              style={{ zIndex: 1500 }}
              anchorEl={inputRef.current}
              open={suggestions.length > 0 || autocompleteLoading || Boolean(status)}
              placement="bottom"
            >
              <Paper square={true} style={{ width: inputRef.current ? inputRef.current.clientWidth : 0 }}>
                <Grid container={true}>
                  <Grid item={true} xs={12}>
                    {autocompleteLoading ? (
                      <Loading variant={LoadingVariant.Linear} />
                    ) : (
                      <List>
                        {status ? (
                          <ListItem dense={true}>
                            <ListItemText
                              primary={
                                (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS &&
                                  'No addresses found') ||
                                status
                              }
                            />
                          </ListItem>
                        ) : (
                          <>
                            {suggestions.map(suggestion => {
                              const { id, key, ref, ...suggestionProps } = getSuggestionItemProps(suggestion, {});

                              return (
                                <ListItem
                                  {...(suggestionProps as ListItemProps<'div'>)}
                                  key={suggestion.id}
                                  button={true}
                                  dense={true}
                                  selected={suggestion.active}
                                >
                                  <ListItemText primary={suggestion.description} />
                                </ListItem>
                              );
                            })}
                          </>
                        )}
                      </List>
                    )}
                  </Grid>
                </Grid>
              </Paper>
            </Popper>
          </>
        );
      }}
    </PlacesAutocomplete>
  );
};

export default GoogleMapsApiHOC(LocationInput);
