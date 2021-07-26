import styled, { css } from 'styled-components';
import { DisFlex } from '@/styles/index';

export const MainContainer = styled(DisFlex)`
  display: none;
  position: fixed;
  left: 0;
  top: 56px;
  bottom: 0;
  font-size: 1.05em;
  background-color: var(--guide-bg);
  padding: 10px 0;
  flex-direction: column;
  width: 90px;
  border-right: 1px solid var(--border-color);

  .svg-active {
    fill: #909090;
  }

  .svg-active-stroke {
    stroke: #909090;
  }

  .link-active {
    color: var(--primary-fg);
    background: rgba(255, 255, 255, 0.2);
    color: #5c9900;
    border-left: 3px solid var(--color-success-600);

    &:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .svg-active {
      fill: #70bb00 !important;
    }

    .svg-active-stroke {
      stroke: #70bb00 !important;
    }
  }

  .line {
    margin: 10px 0;
    height: 0px !important;
    padding: 1px 0;
    background-color: var(--border-color);
  }

  @media screen and (max-width: 1330px) {
    display: flex;
  }

  @media screen and (max-width: 800px) {
    display: none;
  }
`;

export const Container = styled(MainContainer)`
  ${(props) => {
    if (props.Mode === 1 && props.QueryMatches) {
      if (props.Show) {
        return css`
          display: none !important;
        `;
      }
      return css`
        display: flex !important;
      `;
    } else if (props.Mode === 2) {
      if (props.Show) {
        return css`
          display: none !important;
        `;
      }
      return css`
        display: flex !important;
      `;
    }
  }}

  .line {
    margin: 5px 0;
    height: 0px !important;
    padding: 0.5px 0;
    background-color: var(--guide-border-color);
  }
`;
