import * as React from 'react';
import * as renderer from 'react-test-renderer';
import { Overlay } from '../Overlay';

test('that Overlay renders', () => {
  const tree = renderer.create(
    <Overlay />
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
