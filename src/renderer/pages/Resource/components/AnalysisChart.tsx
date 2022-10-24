import * as React from 'react';

import { filesize } from 'filesize';
import { useStyletron } from 'baseui';
import { ResponsivePie } from '@nivo/pie';
import type { PieSvgProps } from '@nivo/pie';

import { Spinner } from 'baseui/spinner';
import { LabelXSmall } from 'baseui/typography';
import { RecativeBlock } from 'components/Block/RecativeBlock';

import { server } from 'utils/rpc';
import { useAsync } from '@react-hookz/web';

export interface IAnalysisResultItem {
  id: string;
  label: string;
  value: number;
}

const PADDING = 20;

const MARGIN = { top: PADDING, right: PADDING, bottom: PADDING, left: PADDING };

const COLORS = { scheme: 'greys' } as const;

const BORDER_COLOR = {
  from: 'color',
  modifiers: [['darker', 0.2] as ['darker', number]],
};

const ARC_LINK_LABELS_TEXT_COLOR = {
  from: 'color',
  modifiers: [['darker', 2] as ['darker', number]],
};

const ARC_LINK_LABELS_COLOR = { from: 'color' };

const DEFS = [
  {
    id: 'dots',
    type: 'patternDots',
    background: 'inherit',
    color: 'rgba(255, 255, 255, 0.3)',
    size: 4,
    padding: 1,
    stagger: true,
  },
  {
    id: 'lines',
    type: 'patternLines',
    background: 'inherit',
    color: 'rgba(255, 255, 255, 0.3)',
    rotation: -45,
    lineWidth: 6,
    spacing: 10,
  },
];

const LEGENDS = [] as PieSvgProps<unknown>['legends'];

export interface IAnalysisChartProps {
  isOpen: boolean;
  episodeId: string;
}

const InternalAnalysisChart: React.FC<IAnalysisChartProps> = ({
  isOpen,
  episodeId,
}) => {
  const [, theme] = useStyletron();

  const [analysis, analysisActions] = useAsync(() => {
    return server.getEpisodeAnalysis(episodeId);
  });

  React.useEffect(() => {
    if (isOpen) {
      analysisActions.execute();
    }
  }, [isOpen, episodeId, analysisActions]);

  const data = React.useMemo(() => {
    const result: IAnalysisResultItem[] = [];

    if (!analysis.result) return result;

    analysis.result.forEach((value, key) => {
      result.push({
        label: key,
        id: key,
        value,
      });
    });

    return result;
  }, [analysis.result]);

  return (
    <RecativeBlock className="analysis_chart" height="200px">
      {analysis.status !== 'success' && (
        <RecativeBlock
          height="200px"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Spinner />
        </RecativeBlock>
      )}
      {analysis.status === 'success' && (
        <ResponsivePie
          data={data}
          margin={MARGIN}
          innerRadius={0.5}
          padAngle={0.7}
          cornerRadius={0}
          activeOuterRadiusOffset={8}
          colors={COLORS}
          borderWidth={1}
          borderColor={BORDER_COLOR}
          enableArcLinkLabels={false}
          arcLabel="id"
          arcLinkLabelsSkipAngle={10}
          arcLinkLabelsTextColor="#333333"
          arcLinkLabelsThickness={2}
          arcLinkLabelsColor={ARC_LINK_LABELS_COLOR}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={ARC_LINK_LABELS_TEXT_COLOR}
          animate={false}
          tooltip={(e) => {
            return (
              <RecativeBlock
                display="flex"
                padding="6px 12px"
                background={theme.colors.backgroundInverseSecondary}
              >
                <LabelXSmall color={theme.colors.primaryB} marginRight="0.5ch">
                  <strong>{e.datum.label}</strong>:{' '}
                </LabelXSmall>
                <LabelXSmall color={theme.colors.primaryB}>
                  {filesize(e.datum.value).toString()}
                </LabelXSmall>
              </RecativeBlock>
            );
          }}
          defs={DEFS}
          legends={LEGENDS}
        />
      )}
    </RecativeBlock>
  );
};

export const AnalysisChart = React.memo(InternalAnalysisChart);
