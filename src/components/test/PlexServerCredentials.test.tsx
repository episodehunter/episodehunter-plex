import * as React from 'react';
import * as renderer from 'react-test-renderer';
import { PlexServerCredentials } from '../PlexServerCredentials';

test('that PlexServerCredentials renders', () => {
  const fun = () => {};
  const tree = renderer.create(
    <PlexServerCredentials connection={false} onCancel={fun} host="" onSucess={fun} plexToken="" port={80} />
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
