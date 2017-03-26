import * as React from 'react';
import * as renderer from 'react-test-renderer';
import { StatusIcon } from '../StatusIcon';

test('that StatusIcon renders', () => {
  const tree = renderer.create(
    <StatusIcon status={0} />
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
