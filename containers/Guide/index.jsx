import React, { memo, Fragment, useEffect, useState } from 'react';
import { Container, Bg, Wrapper, ContentContainer } from './styles';
import ItemLink from './ItemLink';
import {
  DashboardSvg,
  DollarSvg,
  InvoiceSvg,
  BookmarkSvg,
  BellSvg
} from '@/components/svg/index';
import dynamic from 'next/dynamic';
import PropTypes from 'prop-types';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const SimpleBarReact = dynamic(() => import('simplebar-react'), {
  // eslint-disable-next-line react/display-name
  loading: () => <div></div>
});

const Guide = ({ GuideState, setGuideState }) => {
  const { mode, show } = GuideState;
  
  const [QueryMatches1330, setQueryMatches1330] = useState(false);
  const MediaQueryMatchesMin1330 = useMediaQuery('min-width', 1330);
  const MediaQueryMatchesMax1330 = useMediaQuery('max-width', 1330);

  const HandleCloseGuide = (event) => {
    const GuideContainer = document.getElementById('guide-container');
    if (GuideContainer?.isSameNode(event.target)) {
      GuideContainer?.removeEventListener('click', HandleCloseGuide);
      setGuideState((prev) => {
        return {
          show: false,
          mode: prev.mode
        };
      });
    }
  };

  useEffect(() => {
    const GuideContainer = document.getElementById('guide-container');
    const absWidth = window.innerWidth
      if (mode === 1 && absWidth <= 1330 && show) {
        GuideContainer?.addEventListener('click', HandleCloseGuide);
      }else if (mode === 0 && show) {
          GuideContainer?.addEventListener('click', HandleCloseGuide);
      }
  }, [show, HandleCloseGuide, mode]);

  useEffect(() => {
    const absWidth = window.innerWidth
    if(MediaQueryMatchesMin1330  && !MediaQueryMatchesMax1330 || absWidth >= 1330){
      setQueryMatches1330(true)
    }else{
      setQueryMatches1330(false)
    }
  }, [MediaQueryMatchesMin1330, MediaQueryMatchesMax1330])

  return (
    <Fragment>
      <Bg Mode={mode} Show={show}></Bg>
      <Container id="guide-container" Mode={mode} Show={show} QueryMatches={QueryMatches1330}>
        <Wrapper>
          <ContentContainer>
            <SimpleBarReact
              style={{ maxHeight: '100%', padding: '.9em 0 1.15em 0', overflowX: 'hidden' }}
              autoHide={true}
            >
              <ItemLink mode={2} href="/dashboard" label="Dashboard">
                <DashboardSvg width={20} height={20} />
              </ItemLink>
              <ItemLink mode={2} href="/categories" label="Categories">
                <BookmarkSvg width={20} height={20} />
              </ItemLink>
              <ItemLink mode={2} href="/notifications" label="Notifications">
                <BellSvg width={20} height={20} />
              </ItemLink>
              <div className="line"></div>
              <ItemLink mode={2} href="/orders" label="Orders">
                <DollarSvg width={20} height={20} />
              </ItemLink>
              <ItemLink mode={2} href="/invoices" label="Invoices">
                <InvoiceSvg width={20} height={20} />
              </ItemLink>
            </SimpleBarReact>
          </ContentContainer>
        </Wrapper>
      </Container>
    </Fragment>
  );
};

Guide.propTypes = {
  GuideState: PropTypes.shape({
    show: PropTypes.bool,
    mode: PropTypes.number
  }),
  setGuideState: PropTypes.func
};

export default memo(Guide);
