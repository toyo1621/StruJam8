import { Component, type ErrorInfo, type ReactNode } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
  onReload?: () => void;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("StruJam8 UI rendering failed", error, errorInfo);
  }

  private handleReload = () => {
    if (this.props.onReload) {
      this.props.onReload();
      return;
    }

    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="app-error-boundary" role="alert" aria-labelledby="app-error-heading">
        <section className="app-error-panel">
          <p className="eyebrow">StruJam8</p>
          <h1 id="app-error-heading">画面を読み込めませんでした</h1>
          <p>予期しないエラーが発生しました。再読み込みしてもう一度試してください。</p>
          <button type="button" onClick={this.handleReload}>
            再読み込み
          </button>
        </section>
      </main>
    );
  }
}
