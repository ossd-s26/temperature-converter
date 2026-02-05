# Temperature Converter

Temperature Converter is a chromium browser extension that attempts to convert
instances of temperature measured in degrees from Fahrenheit to Celsius and vice
versa.

## Installation

TODO

## Contributing

### Code Reviews

No submissions require code review. Our mechanism to prevent bad code from
breaking the `main` branch is the `staging` branch. This branch is designed to
allow the project contributors to test updates before releasing them to
`main`.

### Versioning

Merging a pull request from a feature/fix branch into `staging` should be
considered a sub-minor version iteration (0.0.12 --> 0.0.13). Merging a change
from staging to main should be considered a minor version iteration
(0.12.0 --> 0.13.0). Major version changes should only occur when core
maintainers agree that the functionality has changed enough to warrant it.

All version changes require documentation updates and internal versioning
updates.

### Development Environment

#### Develpoment Dependencies

Install [Node.js](https://nodejs.org/en/download) however it comes packaged for
your system.

#### Getting Started

Below are the steps to get started:

```bash
# clone the repository to your local machine
git clone https://github.com/ossd-s26/temperature-converter.git

cd temperature-converter

# Install node dependencies for constisten project formatting + linting
npm install
```

After you complete writing your code, please run the formatting and linting
scripts configured in the `package.json` file:

```
npm run fmt
npm run lint
```

## License

TODO

## Roadmap

TODO
