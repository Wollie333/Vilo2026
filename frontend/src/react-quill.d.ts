declare module 'react-quill' {
  import { Component } from 'react';

  export interface ReactQuillProps {
    value?: string;
    defaultValue?: string;
    placeholder?: string;
    readOnly?: boolean;
    onChange?: (content: string, delta: any, source: string, editor: any) => void;
    onChangeSelection?: (selection: any, source: string, editor: any) => void;
    onFocus?: (selection: any, source: string, editor: any) => void;
    onBlur?: (previousSelection: any, source: string, editor: any) => void;
    onKeyPress?: (event: any) => void;
    onKeyDown?: (event: any) => void;
    onKeyUp?: (event: any) => void;
    bounds?: string | HTMLElement;
    children?: React.ReactElement<any>;
    className?: string;
    formats?: string[];
    id?: string;
    modules?: any;
    preserveWhitespace?: boolean;
    style?: React.CSSProperties;
    tabIndex?: number;
    theme?: string;
    [key: string]: any;
  }

  export default class ReactQuill extends Component<ReactQuillProps> {}
}
