import * as React from 'react';

import { useAsync } from '@react-hookz/web';
import { useStyletron } from 'styletron-react';

import { Chart, ChartOptions } from 'react-charts';

import { Spinner } from 'baseui/spinner';
import { ButtonGroup, MODE as BUTTON_GROUP_MODE } from 'baseui/button-group';
import {
  Modal,
  ModalBody,
  ModalButton,
  ModalFooter,
  ModalHeader,
  ModalOverrides,
  ROLE,
  SIZE,
} from 'baseui/modal';
import {
  Button,
  KIND as BUTTON_KIND,
  SIZE as BUTTON_SIZE,
} from 'baseui/button';

import { RecativeBlock } from 'components/Block/RecativeBlock';

import { server } from 'utils/rpc';
import { useEvent } from 'utils/hooks/useEvent';
import { ModalManager } from 'utils/hooks/useModalManager';
import { useBundleProfiles } from 'utils/hooks/useBundleProfiles';
import { useProfileChangeCallback } from 'components/ProfileTable/ProfileTable';

import { BundleOptionItem } from './BundleOptionItem';

const modalOverrides: ModalOverrides = {
  Dialog: {
    style: {
      width: '80vw',
    },
  },
};

const ulStyles = {
  paddingLeft: '0',
  paddingRight: '0',
  listStyle: 'none',
};

export const useAnalysisModal = ModalManager<number, null>(null);

interface IFormattedReport {
  label: string;
  data: {
    primary: string;
    secondary: number;
  }[];
}

const PIVOT_BY = ['mime', 'source'] as const;
const DATA_TYPE = ['count', 'size'] as const;

export const AnalysisModal: React.FC = () => {
  const [css] = useStyletron();

  const [bundleProfiles, selectedBundleProfile, setSelectedBundleProfile] =
    useBundleProfiles();

  const candidates = React.useMemo(
    () => bundleProfiles.result?.map((x) => x.id) ?? [],
    [bundleProfiles.result]
  );

  const handleSelectedBundleProfileChange = useProfileChangeCallback(
    candidates,
    selectedBundleProfile,
    setSelectedBundleProfile
  );

  const [showAnalysisModal, data, , onClose] = useAnalysisModal();

  const getBundleAnalysis = useEvent(async () => {
    if (!data) return null;

    const report = await server.createBundles(
      selectedBundleProfile,
      data,
      true as const
    );

    return report;
  });

  const [analysisReport, analysisReportActions] = useAsync(getBundleAnalysis);

  const [pivotByIndex, setPivotBy] = React.useState(0);
  const [dataTypeIndex, setDataType] = React.useState(0);

  const pivotBy = PIVOT_BY[pivotByIndex];
  const dataType = DATA_TYPE[dataTypeIndex];

  const handlePivotChange = useEvent((_event: unknown, index: number) => {
    setPivotBy(index);
  });

  const handleDataTypeChange = useEvent((_event: unknown, index: number) => {
    setDataType(index);
  });

  const formattedData = React.useMemo(() => {
    const report = analysisReport.result;
    if (!report) return null;

    return report.map(([profileId, episodeMap]) => {
      const profileReport: IFormattedReport[] = [];
      episodeMap.forEach((mimeMap, episodeId) => {
        mimeMap.forEach((resourceSourceMap, mimeType) => {
          resourceSourceMap.forEach((reportUnit, resourceSource) => {
            const pivotQuery = pivotBy === 'mime' ? mimeType : resourceSource;
            const pivotIndex = profileReport.findIndex(
              (x) => x.label === pivotQuery
            );

            const pivotList =
              pivotIndex < 0
                ? ([] as IFormattedReport['data'])
                : profileReport[pivotIndex].data;

            if (pivotIndex < 0) {
              profileReport.push({
                label: pivotQuery,
                data: pivotList,
              });
            }

            const episodeIdIndex = pivotList.findIndex(
              (x) => x.primary === episodeId
            );

            const dataItem =
              episodeIdIndex < 0
                ? {
                    primary: episodeId
                      .split(', ')
                      .map((x) => x.substring(0, 4))
                      .join(', '),
                    secondary: 0,
                  }
                : pivotList[episodeIdIndex];

            if (episodeIdIndex < 0) {
              pivotList.push(dataItem);
            }

            if (dataType === 'count') {
              dataItem.secondary += reportUnit.count;
            }

            if (dataType === 'size') {
              dataItem.secondary += reportUnit.size / (1024 * 1024);
            }
          });
        });
      });

      return [profileId, profileReport] as const;
    });
  }, [analysisReport.result, dataType, pivotBy]);

  const handleAnalysis = useEvent(() => {
    return analysisReportActions.execute();
  });

  const handleClose = useEvent(() => {
    analysisReportActions.reset();
    onClose();
  });

  const primaryAxis = React.useMemo(
    () => ({
      position: 'left' as const,
      getValue: (datum: IFormattedReport['data'][number]) => datum.primary,
    }),
    []
  );

  const secondaryAxes = React.useMemo(
    () => [
      {
        position: 'bottom' as const,
        getValue: (datum: IFormattedReport['data'][number]) => datum.secondary,
        stacked: true,
      },
    ],
    []
  );

  return (
    <Modal
      onClose={handleClose}
      isOpen={showAnalysisModal}
      animate
      autoFocus
      closeable={false}
      overrides={analysisReport.result ? modalOverrides : undefined}
      size={SIZE.default}
      role={ROLE.dialog}
    >
      <ModalHeader>Bundle Analysis</ModalHeader>
      {!analysisReport.result && analysisReport.status !== 'loading' && (
        <>
          <ModalBody>
            <ul className={css(ulStyles)}>
              {bundleProfiles.result?.map((x) => {
                return (
                  <BundleOptionItem
                    key={x.id}
                    title={x.label}
                    description={x.extensionId}
                    id={x.id}
                    value={selectedBundleProfile.includes(x.id)}
                    onChange={handleSelectedBundleProfileChange}
                  />
                );
              })}
            </ul>
          </ModalBody>
          <ModalFooter>
            <ModalButton kind={BUTTON_KIND.tertiary} onClick={handleClose}>
              Close
            </ModalButton>
            <ModalButton kind={BUTTON_KIND.primary} onClick={handleAnalysis}>
              Analysis
            </ModalButton>
          </ModalFooter>
        </>
      )}
      {analysisReport.status === 'loading' && (
        <RecativeBlock
          height="200px"
          paddingBottom="48px"
          width="100%"
          justifyContent="center"
          alignItems="center"
          display="flex"
        >
          <Spinner />
        </RecativeBlock>
      )}
      {analysisReport.result && (
        <>
          <ModalBody>
            <RecativeBlock display="flex" marginBottom="16px" marginTop="32px">
              <RecativeBlock>
                <ButtonGroup
                  mode={BUTTON_GROUP_MODE.radio}
                  size={BUTTON_SIZE.mini}
                  selected={pivotByIndex}
                  onClick={handlePivotChange}
                >
                  <Button>MIME</Button>
                  <Button>Source Type</Button>
                </ButtonGroup>
              </RecativeBlock>
              <RecativeBlock marginLeft="8px">
                <ButtonGroup
                  mode={BUTTON_GROUP_MODE.radio}
                  size={BUTTON_SIZE.mini}
                  selected={dataTypeIndex}
                  onClick={handleDataTypeChange}
                >
                  <Button>Count</Button>
                  <Button>Size</Button>
                </ButtonGroup>
              </RecativeBlock>
            </RecativeBlock>
            {formattedData?.map(([profileId, report]) => {
              const chartOptions: ChartOptions<
                IFormattedReport['data'][number]
              > = {
                data: report,
                primaryAxis,
                secondaryAxes,
              };

              return (
                <RecativeBlock key={profileId} height="400px">
                  <Chart options={chartOptions} />
                </RecativeBlock>
              );
            })}
          </ModalBody>
          <ModalFooter>
            <ModalButton kind={BUTTON_KIND.primary} onClick={handleClose}>
              Close
            </ModalButton>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
};
