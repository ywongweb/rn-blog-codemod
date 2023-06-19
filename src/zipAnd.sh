#!/bin/bash

cd $1 || exit

for file in *.apk
  do zip ${file%.*}.zip $file
done
