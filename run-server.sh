#!/bin/bash
/home/eru/.local/bin/php -d upload_max_filesize=64M -d post_max_size=70M -S 127.0.0.1:8000 -t public
