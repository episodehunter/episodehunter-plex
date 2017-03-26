import * as React from 'react';
import * as renderer from 'react-test-renderer';
import { PlexLogin } from '../PlexLogin';

test('that PlexLogin renders', () => {
  const fun = () => {};
  const tree = renderer.create(
    <PlexLogin onCancel={fun} onSucess={fun} token="" username="" />
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
