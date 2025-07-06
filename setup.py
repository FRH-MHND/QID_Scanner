from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

# get version from __version__ variable in qid_scanner/__init__.py
from qid_scanner import __version__ as version

setup(
	name="qid_scanner",
	version=version,
	description="Qatar ID Document Scanner with OCR for ERPNext",
	author="Your Company",
	author_email="admin@yourcompany.com",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)

