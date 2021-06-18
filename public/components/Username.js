class Username extends React.Component {
    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);

        this.state = {value: '', submitted: false};
    }
    handleChange(event) {
        this.setState({value: event.target.value});
    }
    handleSubmit(event) {
        this.props.onUsernameSubmit(this.state.value);
        this.setState({submitted: true});
        event.preventDefault();
    }
    render() {
        if (this.state.submitted)
            return null;
        return (
            <div id="user-select">
                <h3>Please enter your username</h3>
                <form id="user-form" action="" onSubmit={this.handleSubmit}>
                    <input id="user-name" autoComplete="off" onChange={(event) => this.handleChange(event)} /><button>Ok</button>
                </form>
            </div>
        );
    }
}