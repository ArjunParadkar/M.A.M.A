# Installing pip on Arch Linux

## Option 1: Install pip using pacman (Recommended)

```bash
sudo pacman -S python-pip
```

Then verify:
```bash
pip --version
```

## Option 2: Install pip using ensurepip

```bash
python3 -m ensurepip --upgrade
```

Then verify:
```bash
python3 -m pip --version
```

## Option 3: Install pip using get-pip.py

```bash
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
python3 get-pip.py
```

---

## After pip is installed:

```bash
cd /home/god/Desktop/M.A.M.A/api
pip install -r requirements.txt
```

OR if using python3 -m pip:

```bash
cd /home/god/Desktop/M.A.M.A/api
python3 -m pip install -r requirements.txt
```

---

## Quick Command (Try this first):

```bash
sudo pacman -S python-pip && cd /home/god/Desktop/M.A.M.A/api && pip install -r requirements.txt
```

