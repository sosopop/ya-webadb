import { Icon, MessageBar, Separator, Stack, StackItem, mergeStyleSets, Text } from '@fluentui/react';
import { Depths, FontSizes, NeutralColors, CommunicationColors, DefaultPalette } from '@fluentui/theme';
import { AdbFeatures } from '@yume-chan/adb';
import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { ExternalLink } from '../components';
import { withDisplayName } from '../utils';
import { RouteProps } from './type';
import {
    Chart,
    Point,
    Area,
    Annotation,
    Axis,
    Coordinate,
    registerShape,
    registerAnimation,
} from 'bizcharts';

import { RegisterShape, Shape } from 'bizcharts/lib/interface';

const classNames = mergeStyleSets({
    'title': {
        fontWeight: 'bold',
        color: NeutralColors.gray120,
    },
    'panel': {
        boxShadow: Depths.depth4,
        backgroundColor: NeutralColors.white,
        padding: 10,
    }
});

// 自定义Shape 部分
registerShape('point', 'pointer', {
    draw(cfg: any, container: any) {
        const group = container.addGroup();

        const center = this.parsePoint({ x: 0, y: 0 }); // 获取极坐标系下画布中心点
        const start = this.parsePoint({ x: 0, y: 0.5 }); // 获取极坐标系下起始点

        const preAngle = this.preAngle || 0;

        const angle1 = Math.atan((start.y - center.y) / (start.x - center.x));
        const angle = (Math.PI - 2 * (angle1)) * cfg.points[0].x;

        this.preAngle = angle;

        return group;
    },
} as any);

const scale = {
    value: {
        min: 0,
        max: 1,
        tickInterval: 0.1,
        formatter: (v: any) => v * 100
    }
}

const knownFeatures: Record<string, string> = {
    'shell_v2': `"shell" command now supports separating child process's stdout and stderr, and returning exit code`,
    // 'cmd': '',
    [AdbFeatures.StatV2]: '"sync" command now supports "STA2" (returns more information of a file than old "STAT") and "LST2" (returns information of a directory) sub command',
    'ls_v2': '"sync" command now supports "LST2" sub command which returns more information when listing a directory than old "LIST"',
    // 'fixed_push_mkdir': '',
    // 'apex': '',
    // 'abb': '',
    // 'fixed_push_symlink_timestamp': '',
    'abb_exec': 'Support "exec" command which can stream stdin into child process',
    // 'remount_shell': '',
    // 'track_app': '',
    // 'sendrecv_v2': '',
    // 'sendrecv_v2_brotli': '',
    // 'sendrecv_v2_lz4': '',
    // 'sendrecv_v2_zstd': '',
    // 'sendrecv_v2_dry_run_send': '',
};

const propsMap: any = {
    "ro.product.model": "设备型号",
    "ro.product.device": "设备名称",
    "ro.product.brand": "设备品牌",
    "ro.product.manufacturer": "设备厂商",
    "ro.build.version.release": "系统版本",
    "ro.build.date": "固件生成日期"
};

export const DeviceInfo = withDisplayName('DeviceInfo')(({
    device
}: RouteProps): JSX.Element | null => {
    const [data, setData] = useState({ value: 0.0 });
    const [sysInfo, setSysInfo] = useState([{ key: "", name: "", value: "" }]);

    useEffect(() => {
        //setData({ value: data.value + 1 });
        device?.getProp("").then((output) => {
            let result: Array<{
                key: string;
                name: string;
                value: string;
            }> = [];
            output.replace(/[\[\]]/ig, "").split("\n").forEach((v) => {
                if (v) {
                    let value = v.match(/(.*?):(.*)/)?.map(v => v.trim());
                    if (value && value.length === 3 && propsMap[value[1]]) {
                        result.push({ "key": value[1], "name": propsMap[value[1]], "value": value[2] });
                    }
                }
            })
            result = result.reverse();
            setSysInfo(result);
        }).catch((e) => { });


        device?.createSocket("shell:busybox top -d3").then(socket => {
            let topString = "";
            socket.onData(buffer => {
                console.log(buffer);
                topString += device.backend.decodeUtf8(buffer);
                let parsedCpu = topString.match(/CPU\:\s?([\d\.]+)%/);
                if (parsedCpu?.length === 2) {
                    setData({ value: parseFloat(parsedCpu[1]) / 100 })
                    console.log(parseFloat(parsedCpu[1]));
                    topString = "";
                } else if (topString.length > 1000) {
                    topString = "";
                }
            });
            socket.onClose(() => console.log("busybox top closed"));
        }).catch((e) => { });
    }, [device]);

    return (
        <>
            <Stack tokens={{
                childrenGap: 10,
            }}>
                <Text variant={'medium'} className={classNames.title}>系统信息</Text>
                <StackItem>
                    <Stack tokens={{
                        childrenGap: 10,
                    }} horizontal>
                        <StackItem grow className={classNames.panel}>
                            <table>
                                <colgroup>
                                    <col span={1} style={{ width: 120 }}></col>
                                    <col span={1}></col>
                                </colgroup>
                                <tbody>
                                    {
                                        sysInfo.map((v) => (
                                            <tr key={v.key}>
                                                <td><b>{v.name}</b></td><td>{v.value}</td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>
                        </StackItem>
                        <StackItem grow className={classNames.panel}>
                        </StackItem>
                    </Stack>
                </StackItem>
                <Text variant={'medium'} className={classNames.title}>系统状态</Text>
                <StackItem className={classNames.panel}>
                    <Stack>
                        <div style={{ width: 100, height: 120 }}>
                            <Chart height={100} data={data} scale={scale} autoFit>
                                <Coordinate
                                    type="polar"
                                    radius={0.75}
                                    startAngle={-1.4 * Math.PI}
                                    endAngle={0.4 * Math.PI}
                                />
                                <Axis
                                    name="value"
                                    line={null}
                                    visible={false}
                                    label={{
                                        offset: -36,
                                        style: {
                                            fontSize: 18,
                                            textAlign: "center",
                                            textBaseline: "middle",
                                        },
                                    }}
                                    grid={null}
                                />
                                <Point position="value*1" color="#1890FF" shape="pointer" />
                                <Annotation.Arc
                                    start={[0, 1]}
                                    end={[1, 1]}
                                    style={{
                                        stroke: "#CBCBCB",
                                        lineWidth: 5,
                                        lineDash: null,
                                        lineCap: "round",
                                    }}
                                />
                                <Annotation.Arc
                                    start={[0, 1]}
                                    end={[data.value, 1]}
                                    style={{
                                        stroke: "#1890FF",
                                        lineCap: "round",
                                        lineWidth: 5,
                                        lineDash: null,
                                    }}
                                />
                                <Annotation.Text
                                    position={["50%", "50%"]}
                                    content={`${Math.round(data.value * 100)}%`}
                                    style={{
                                        fontWeight: 'bold',
                                        fontSize: 14,
                                        fill: "#262626",
                                        textAlign: "center",
                                    }}
                                />
                            </Chart>
                        </div>
                    </Stack>
                </StackItem>
            </Stack>

            {/*                 
            <span>设备型号: {device?.model}</span>
            <span>设备名: {device?.device}</span>
            <Separator /> */}
        </>
    );
});
