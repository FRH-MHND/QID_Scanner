# Contributing to QID Scanner ERPNext App

Thank you for your interest in contributing to the QID Scanner ERPNext App! This document provides guidelines for contributing to this project.

## 🚀 Getting Started

### Prerequisites

- ERPNext development environment
- Python 3.8+
- Node.js 14+
- Tesseract OCR
- Basic knowledge of ERPNext app development

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/qid-scanner-erpnext.git
   cd qid-scanner-erpnext
   ```

2. **Install in ERPNext bench**
   ```bash
   # Copy to bench apps directory
   cp -r . /path/to/bench/apps/qid_scanner
   
   # Install dependencies
   bench --site your-site pip install -r requirements.txt
   
   # Install the app
   bench --site your-site install-app qid_scanner
   ```

3. **Build and restart**
   ```bash
   bench build --app qid_scanner
   bench restart
   ```

## 📝 How to Contribute

### Reporting Bugs

1. **Check existing issues** to avoid duplicates
2. **Use the bug report template** when creating new issues
3. **Include detailed information**:
   - ERPNext version
   - Browser and version
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

### Suggesting Features

1. **Check existing feature requests** to avoid duplicates
2. **Use the feature request template**
3. **Provide detailed description**:
   - Use case and motivation
   - Proposed solution
   - Alternative solutions considered

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the coding standards
   - Add tests if applicable
   - Update documentation

4. **Test your changes**
   ```bash
   # Test OCR functionality
   # Test camera access
   # Test QID validation
   # Test ERPNext integration
   ```

5. **Commit your changes**
   ```bash
   git commit -m "feat: add your feature description"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**

## 🎯 Coding Standards

### Python Code

- Follow PEP 8 style guide
- Use meaningful variable and function names
- Add docstrings for all functions and classes
- Handle exceptions appropriately
- Use type hints where applicable

### JavaScript Code

- Use ES6+ features
- Follow consistent indentation (2 spaces)
- Use meaningful variable names
- Add comments for complex logic
- Handle errors gracefully

### HTML/CSS

- Use semantic HTML elements
- Follow BEM methodology for CSS classes
- Ensure responsive design
- Test on multiple browsers

## 🧪 Testing

### Manual Testing

1. **Camera functionality**
   - Test on different devices
   - Test camera switching
   - Test QR code generation

2. **OCR accuracy**
   - Test with various QID images
   - Test with different lighting conditions
   - Verify extracted information

3. **ERPNext integration**
   - Test page loading
   - Test dialog functionality
   - Test permissions

### Automated Testing

- Add unit tests for new functions
- Test OCR processing pipeline
- Test QID validation logic

## 📚 Documentation

- Update README.md for new features
- Add inline code comments
- Update API documentation
- Include usage examples

## 🔄 Pull Request Process

1. **Ensure all tests pass**
2. **Update documentation** as needed
3. **Add yourself to contributors** if first contribution
4. **Request review** from maintainers
5. **Address feedback** promptly
6. **Squash commits** if requested

## 📋 Commit Message Format

Use conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

Examples:
```
feat(ocr): add support for Arabic text extraction
fix(camera): resolve camera switching issue on iOS
docs(readme): update installation instructions
```

## 🤝 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and general discussion
- **Email**: For security-related issues

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributors page

Thank you for contributing to the QID Scanner ERPNext App! 🎉

